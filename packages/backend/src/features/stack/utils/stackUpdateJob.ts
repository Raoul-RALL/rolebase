import { fetchLatestNpmVersion } from '@rolebase/shared/helpers/fetchLatestVersion'
import {
  StackTechnology,
  StackUpdateJob,
  stackTechnologies,
} from '@rolebase/shared/model/stack'
import { TRPCError } from '@trpc/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// Updates a technology of the stack in the repository this backend runs from:
// bumps its packages to their latest stable version, reinstalls, then checks
// types, tests and webapp build. Any failure restores the previous manifests.
// Changes are left uncommitted, and the backend must be restarted to run them.

const ROOT = path.resolve(__dirname, '../../../../../..')
const WORKSPACES_DIR = path.join(ROOT, 'packages')
const BIN_DIR = path.dirname(process.execPath)
const MAX_LOG_LENGTH = 200000

const verifySteps: { label: string; workspace: string; args: string[] }[] = [
  ...['shared', 'graph', 'editor', 'emails', 'backend', 'webapp'].map(
    (workspace) => ({
      label: `Types ${workspace}`,
      workspace,
      args: ['npx', 'tsgo', '--noEmit', '-p', '.'],
    })
  ),
  ...['shared', 'graph', 'editor', 'backend', 'webapp'].map((workspace) => ({
    label: `Tests ${workspace}`,
    workspace,
    args: ['npx', 'vitest', 'run'],
  })),
  { label: 'Build webapp', workspace: 'webapp', args: ['npm', 'run', 'build'] },
]

let currentJob: StackUpdateJob | undefined

export function getStackUpdateJob(): StackUpdateJob | undefined {
  return currentJob
}

export function startStackUpdateJob(technologyId: string): StackUpdateJob {
  const technology = stackTechnologies.find((tech) => tech.id === technologyId)
  if (!technology?.updatePackages) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not updatable' })
  }
  if (currentJob?.status === 'running') {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'An update is already running',
    })
  }
  if (!fs.existsSync(path.join(ROOT, 'package-lock.json'))) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Backend is not running from the repository',
    })
  }

  const job: StackUpdateJob = {
    technologyId,
    status: 'running',
    startedAt: new Date().toISOString(),
    targets: [],
    log: '',
  }
  currentJob = job
  runJob(job, technology)
  return job
}

function appendLog(job: StackUpdateJob, text: string) {
  job.log = (job.log + text).slice(-MAX_LOG_LENGTH)
}

function run(job: StackUpdateJob, cwd: string, [command, ...args]: string[]) {
  appendLog(job, `\n$ ${command} ${args.join(' ')}\n`)
  return new Promise<void>((resolve, reject) => {
    const child = spawn(path.join(BIN_DIR, command), args, {
      cwd,
      env: {
        ...process.env,
        PATH: `${BIN_DIR}:${process.env.PATH}`,
        NODE_ENV: 'development',
        CI: '1',
      },
    })
    child.stdout.on('data', (data) => appendLog(job, data.toString()))
    child.stderr.on('data', (data) => appendLog(job, data.toString()))
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`Exit code ${code}`))
    )
  })
}

function getManifestPaths(): string[] {
  return [
    path.join(ROOT, 'package.json'),
    ...fs
      .readdirSync(WORKSPACES_DIR)
      .map((dir) => path.join(WORKSPACES_DIR, dir, 'package.json'))
      .filter((file) => fs.existsSync(file)),
  ]
}

function matchesPackage(name: string, patterns: string[]) {
  return patterns.some((pattern) =>
    pattern.endsWith('*')
      ? name.startsWith(pattern.slice(0, -1))
      : name === pattern
  )
}

// Package names of the technology declared in the manifests
function findDeclaredPackages(manifestPaths: string[], patterns: string[]) {
  const names = new Set<string>()
  for (const file of manifestPaths) {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    for (const deps of [manifest.dependencies, manifest.devDependencies]) {
      for (const name of Object.keys(deps ?? {})) {
        if (matchesPackage(name, patterns)) names.add(name)
      }
    }
  }
  return [...names]
}

// Sets the new version ranges, keeping exact pins exact
function bumpManifests(
  manifestPaths: string[],
  versions: Record<string, string>
) {
  for (const file of manifestPaths) {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
    let changed = false
    for (const deps of [manifest.dependencies, manifest.devDependencies]) {
      for (const name of Object.keys(deps ?? {})) {
        if (!versions[name]) continue
        const isExact = /^\d/.test(deps[name])
        deps[name] = isExact ? versions[name] : `^${versions[name]}`
        changed = true
      }
    }
    if (changed)
      fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')
  }
}

async function runJob(job: StackUpdateJob, technology: StackTechnology) {
  const manifestPaths = getManifestPaths()
  const backupPaths = [...manifestPaths, path.join(ROOT, 'package-lock.json')]
  const backups = new Map(
    backupPaths.map((file) => [file, fs.readFileSync(file, 'utf8')])
  )

  try {
    const names = findDeclaredPackages(
      manifestPaths,
      technology.updatePackages!
    )
    const versions: Record<string, string> = {}
    for (const name of names) {
      const version = await fetchLatestNpmVersion(name)
      if (version === 'unknown')
        throw new Error(`No stable version for ${name}`)
      versions[name] = version
    }
    job.targets = names.map((name) => `${name}@${versions[name]}`)
    appendLog(job, `Targets: ${job.targets.join(', ')}\n`)

    bumpManifests(manifestPaths, versions)
    job.step = 'Install'
    await run(job, ROOT, ['npm', 'install', '--no-audit', '--no-fund'])

    for (const step of verifySteps) {
      job.step = step.label
      appendLog(job, `\n=== ${step.label} ===`)
      await run(job, path.join(WORKSPACES_DIR, step.workspace), step.args)
    }

    job.status = 'success'
  } catch (error) {
    appendLog(job, `\n\n!!! ${error}\nRestoring previous versions...\n`)
    job.failedStep = job.step
    job.step = 'Restore'
    for (const [file, content] of backups) fs.writeFileSync(file, content)
    try {
      await run(job, ROOT, ['npm', 'install', '--no-audit', '--no-fund'])
      await run(job, path.join(WORKSPACES_DIR, 'webapp'), [
        'npm',
        'run',
        'build',
      ])
    } catch (restoreError) {
      appendLog(job, `\n!!! Restore failed: ${restoreError}\n`)
    }
    job.status = 'failed'
  }
  job.step = undefined
  job.endedAt = new Date().toISOString()
}
