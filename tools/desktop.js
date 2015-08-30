var Console = require('./console.js').Console;
var files = require('./files.js');
var electronExample = require('./electron-main.js')
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
  var self = this

  try {
    var m  = require(module + opt)
    if (m) {
      Console.info('Loading ' + module + '...')
      return m
    }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      Console.info(module + ' not found...')
      Console.info('Installing ' + module + ' now...')
      self.installModule(module)
    }
    // return 1
  }
}

Desktop.installModule = function (module) {
  var p = path
  var spawn = child.spawn

  var c = spawn('npm', ['i', module], {cwd: this.nodeModulesPath(), stdio: 'inherit'})

  c.on('close', function () {
    Console.warn()
    Console.labelWarn('Installed ' + module + '.')
  })
}

Desktop.Electron.start = function () {
  try {
    var electron = Desktop.prebuilt
    var spawn = child.spawn

    // var meteorAppPath = 

    spawn(electron, [/*meteorAppPath*/], {cwd: Desktop.nodeModulesPath(), stdio: 'inherit'})
  } catch (e) {
    Console.error(e.message)
    return 1
  }
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
    mkdir(electron.dir)
  }

  // .electron/out/
  if (!test('-d', electron.outPath)) {
    mkdir(electron.outPath)
  }

  // .electron/app/
  if (!test('-d', electron.appPath)) {
    mkdir(electron.appPath)
  }

  // .electron/app/main.js
  if (!test('-f', electron.mainFilePath)) {
    var m = electronExample

    m.to(electron.mainFilePath)
  }

  // .electron/app/package.json
  if (!test('-f', electron.packageFilePath)) {
    var j = JSON.stringify(defaultOptions)

    j.to(electron.packageFilePath)
  }


}



module.exports = Desktop
