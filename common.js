const os = require('os')
const fs = require('fs')
const util = require('util')
const stream = require('stream')
const crypto = require('crypto')
const path = require('path')
const core = require('@actions/core')
const { performance } = require('perf_hooks')

export async function measure(name, block) {
  return await core.group(name, async () => {
    const start = performance.now()
    try {
      return await block()
    } finally {
      const end = performance.now()
      const duration = (end - start) / 1000.0
      console.log(`Took ${duration.toFixed(2).padStart(6)} seconds`)
    }
  })
}

export function isHeadVersion(rubyVersion) {
  return rubyVersion === 'head' || rubyVersion === 'debug' || rubyVersion === 'mingw' || rubyVersion === 'mswin'
}

export async function hashFile(file) {
  // See https://github.com/actions/runner/blob/master/src/Misc/expressionFunc/hashFiles/src/hashFiles.ts
  const hash = crypto.createHash('sha256')
  const pipeline = util.promisify(stream.pipeline)
  await pipeline(fs.createReadStream(file), hash)
  return hash.digest('hex')
}

export function getVirtualEnvironmentName() {
  const platform = os.platform()
  if (platform === 'linux') {
    return `ubuntu-${findUbuntuVersion()}`
  } else if (platform === 'darwin') {
    return 'macos-latest'
  } else if (platform === 'win32') {
    return 'windows-latest'
  } else {
    throw new Error(`Unknown platform ${platform}`)
  }
}

function findUbuntuVersion() {
  const lsb_release = fs.readFileSync('/etc/lsb-release', 'utf8')
  const match = lsb_release.match(/^DISTRIB_RELEASE=(\d+\.\d+)$/m)
  if (match) {
    return match[1]
  } else {
    throw new Error('Could not find Ubuntu version')
  }
}

// convert windows path like C:\Users\runneradmin to /c/Users/runneradmin
export function win2nix(path) { 
  if (/^[A-Z]:/i.test(path)) {
    // path starts with drive
    path = `/${path[0].toLowerCase()}${path.split(':', 2)[1]}`
  }
  return path.replace(/\\/g, '/').replace(/ /g, '\\ ')
}

class CmdCls {
  constructor() {
    this.varis = []
    this.paths = []
    this.os_path = os.platform() === 'win32' ? 'Path' : 'PATH'
    this.ENV = process.env
  }
  
  addVari(k,v) {
    this.varis.push([k,v])
    //this.ENV[k] = v
  }
  
  addPath(item) {
    this.paths.unshift(item)
    this.ENV[this.os_path] = `${item}${path.delimiter}${this.ENV[this.os_path]}`
  }

  cmdVaris() {
    let cmdStr = ''
    const iterator = this.varis.values()
    for (const kv of iterator) {
      cmdStr = cmdStr.concat(`::set-env name=${kv[0]}::${kv[1]}${os.EOL}`)
    }
    return cmdStr
  }
  
  sendVaris() {
    const cmdStr = this.cmdVaris()
    process.stdout.write(cmdStr)
  }
  
  sendPath() {
    const os_path = this.os_path
    process.stdout.write(`::set-env name=${os_path}::${this.ENV[os_path]}${os.EOL}`)
  }
  
  sendAll() {
    const os_path = this.os_path
    let cmdStr = this.cmdVaris()
    cmdStr = cmdStr.concat(`::set-env name=${os_path}::${this.ENV[os_path]}${os.eol}`)
    process.stdout.write(cmdStr)
  }
}

export const cmd = new CmdCls
