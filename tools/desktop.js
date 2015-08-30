var Console = require('./console.js').Console;
var files = require('./files.js');
var electronExample = require('./electron-main.js')
var _ = require('underscore')
var path = require('path')
var child = require('child_process')

var Desktop = {
  Electron: {},
  shelljs: function () {
    return this.checkModuleAndDownload('shelljs', '/global')
  },
  prebuilt: function () {
    return this.checkModuleAndDownload('electron-prebuilt')
  },
  packager: function () {
    return this.checkModuleAndDownload('electron-packager')
  }
}

Desktop.nodeModulesPath = function () {
  return path.join(files.getCurrentToolsDir(), 'dev_bundle', 'lib', 'node_modules')
}

Desktop.meteorToolPath = files.getCurrentToolsDir()

Desktop.checkModuleAndDownload = function (module, opt) {
  var _module = module

  if (opt) {
    _module = _module + opt
  }

  try {
    var m  = require(_module)

    if (m) {
      Console.info()
      Console.info('Loading ' + module + '...')
      Console.info()
      return m
    }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' || e.code === 'ENOENT') {
      Console.info()
      Console.info(module + ' not found...')
      Console.info('Installing ' + module + ' now...')
      this.installModule(module)
    }
    return 1
  }
}

Desktop.installModule = function (module) {
  var p = path
  var spawn = child.spawn

  var c = spawn('npm', ['i', module], {cwd: this.nodeModulesPath(), stdio: 'inherit'})

  c.on('close', function () {
    Console.info('Installed ' + module + '.')
    Console.info('Please run command again')

  })
}

Desktop.Electron.appPath = path.join(process.cwd(), '.electron', 'app')

Desktop.Electron.start = function () {
  Desktop.shelljs()

  var hasElectronFiles = !!test('-f', path.join(this.appPath, 'main.js'))

  if (!hasElectronFiles) throw new Error('ELECTRON_APP_NOT_FOUND')

  var electron = Desktop.prebuilt()
  var spawn = child.spawn
  var electronAppPath = this.appPath

  spawn(electron, [electronAppPath], {cwd: Desktop.nodeModulesPath(), stdio: 'inherit'})
}


Desktop.Electron.addFoldersAndFiles = function () {
  // Include shelljs
  Desktop.shelljs()
  var p = path
  var nodeModulesPath = Desktop.nodeModulesPath()
  var toolPath = Desktop.meteorToolPath

  var electron = {}
  electron.dir = p.join(pwd(), '.electron')
  electron.appPath = p.join(electron.dir, 'app'),
  electron.outPath = p.join(electron.dir, 'out'),
  electron.mainFilePath = p.join(electron.appPath, 'main.js'),
  electron.packageFilePath = p.join(electron.appPath, 'package.json')

  var defaultOptions = {
    name: 'your-app',
    version: '0.1.0',
    main: 'main.js'
  }

  // .electron
  if (!test('-d', electron.dir)) {
    Console.info()
    Console.info('Creating electron directory in project root...')
    Console.info()
    mkdir(electron.dir)
  }

  // .electron/out/
  if (!test('-d', electron.outPath)) {
    Console.info()
    Console.info('Creating electron output directory in project root...')
    Console.info()
    mkdir(electron.outPath)
  }

  // .electron/app/
  if (!test('-d', electron.appPath)) {
    Console.info()
    Console.info('Creating electron app directory in project root...')
    Console.info()
    mkdir(electron.appPath)
  }

  // .electron/app/main.js
  if (!test('-f', electron.mainFilePath)) {
    Console.info()
    Console.info('Setting up Electron main.js')
    Console.info()
    var m = electronExample

    m.to(electron.mainFilePath)
  }

  // .electron/app/package.json
  if (!test('-f', electron.packageFilePath)) {
    Console.info()
    Console.info('Setting up Electron package.json')
    Console.info()
    var j = JSON.stringify(defaultOptions, null, '\t')

    j.to(electron.packageFilePath)
  }
}

Desktop.Electron.packageApp = function (opts) {
  var self = this
  var pkger = Desktop.packager()
  var cwd = process.cwd()
  var out = path.join(cwd, '.electron', 'out')

  // return Console.info(opts)

  pkger({
    dir: this.appPath,
    platform: opts.electronPlatform || process.platform,
    arch: opts.electronArch || process.arch,
    name: opts.electronName || 'MeteorDesktopApp',
    version: opts.electronVersion || '0.31.1',
    out: out
  }, function (err, appPath) {
    if (err) return Console.error(err)

    Console.info()
    Console.info('Packaged up your Meteor app to ' + appPath)
  })
}



module.exports = Desktop
