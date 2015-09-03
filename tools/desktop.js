var Future = require('fibers/future');
var _ = require('underscore')
var path = require('path')
var child = require('child_process')
var Console = require('./console.js').Console;
var files = require('./files.js');
var electronExample = require('./electron-main.js')
var Desktop = {}


////////////////////////////////////////////////////
// Test area for npm packages
////////////////////////////////////////////////////
var meteorToolPath = files.getCurrentToolsDir()

var checkModuleAndDownload = function (module, opt) {
  var future = new Future

  var _module = module

  if (opt) {
    _module = _module + opt
  }

  try {
    var m = require(_module)

    if (m) {
      // Console.info()
      // Console.info('Loading ' + module + '...')
      // Console.info()
      future.return(m)
    }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' || e.code === 'ENOENT') {

      Console.info()
      Console.info(module + ' not found...')
      Console.info('Installing ' + module + ' now...')

      var m = installModule(module).wait()

      // Console.info(m)

      if (m) {
        future.return(require(_module))
      }
    }
  }

  return future
}.future()

var nodeModulesPath = (function () {
  var toolsDir = files.getCurrentToolsDir()

  return process.platform === 'win32' && files.convertToWindowsPath(toolsDir) || toolsDir
})()

var installModule = function (module) {
  var spawn = child.spawn
  var npm = process.platform === 'win32' && 'npm.cmd' || 'npm'
  // Can't use stdio: inherit, because we need to resolve the future
  var r = spawn(npm, ['i', module], {cwd: nodeModulesPath})
  var future = new Future

  r.stdout.on('data', function (d) {
    // Console.info('stdout:data')
    process.stdout.write(d)
  })

  r.stdout.on('close', function (code, signal) {
    if (!code) {
      Console.info('Successfully installed ' + module)
      // Console.info('Requiring module...')
      future.return(true)
    } else {
      Console.info('Something went wrong installing ' + module)
      future.return(false)
    }
  })

  r.stderr.on('error', function (code) {
    Console.info('stderr:exit')
    process.stderr.write(code)
    if (!code) {
      Console.info('Successfully installed ' + module)
    } else {
      Console.info('Something went wrong installing ' + module)
    }
  })

  return future
}

Desktop.start = function (appDir) {
  if (!appDir) throw new Error('app-dir-not-provided')
  appDir = process.platform === 'win32' && files.convertToWindowsPath(appDir) || appDir
  checkModuleAndDownload('shelljs', '/global').wait().value

  appDir = path.join(appDir, '.electron', 'app')

  var hasElectronFiles = !!test('-f', path.join(appDir, 'main.js')) || !!test('-f', path.join(appDir, 'package.json'))

  if (!hasElectronFiles) throw new Error('ELECTRON_APP_NOT_FOUND')

  var electron = checkModuleAndDownload('electron-prebuilt').wait().value
  var spawn = child.spawn

  Console.info('Starting your meteor app with Electron')

  spawn(electron, [appDir], {cwd: nodeModulesPath, stdio: 'inherit'})
}

Desktop.init = function (appDir) {
  appDir = process.platform === 'win32' && files.convertToWindowsPath(appDir) || appDir
  Console.info('Initializing npm modules')

  checkModuleAndDownload('shelljs', '/global').wait().value
  checkModuleAndDownload('electron-prebuilt').wait().value
  checkModuleAndDownload('electron-packager').wait().value

  var desktopAdded = true

  var electron = {}
  electron.dir = path.join(appDir, '.electron')
  electron.appPath = path.join(electron.dir, 'app'),
  electron.outPath = path.join(electron.dir, 'out'),
  electron.mainFilePath = path.join(electron.appPath, 'main.js'),
  electron.packageFilePath = path.join(electron.appPath, 'package.json')
 
  var defaultOptions = {
    name: 'your-app',
    version: '0.1.0',
    main: 'main.js'
  }

  // .electron
  if (!test('-d', electron.dir)) {
    desktopAdded = false
    Console.info()
    Console.info('Creating electron directory in project root...')
    Console.info()
    mkdir(electron.dir)
  }

  // .electron/out/
  if (!test('-d', electron.outPath)) {
    desktopAdded = false
    Console.info()
    Console.info('Creating electron output directory in project root...')
    Console.info()
    mkdir(electron.outPath)
  }

  // .electron/app/
  if (!test('-d', electron.appPath)) {
    desktopAdded = false
    Console.info()
    Console.info('Creating electron app directory in project root...')
    Console.info()
    mkdir(electron.appPath)
  }

  // .electron/app/main.js
  if (!test('-f', electron.mainFilePath)) {
    desktopAdded = false
    Console.info()
    Console.info('Setting up Electron main.js')
    Console.info()
    var m = electronExample

    m.to(electron.mainFilePath)
  }

  // .electron/app/package.json
  if (!test('-f', electron.packageFilePath)) {
    desktopAdded = false
    Console.info()
    Console.info('Setting up Electron package.json')
    Console.info()
    var j = JSON.stringify(defaultOptions, null, '\t')

    j.to(electron.packageFilePath)
  }

  if (desktopAdded) {
    Console.info('Desktop is already added')
  }
}

Desktop.remove = function (appDir) {
  if (!appDir) throw new Error('app-dir-not-provided')
  appDir = process.platform === 'win32' && files.convertToWindowsPath(appDir) || appDir

  checkModuleAndDownload('shelljs', '/global').wait().value

  var electronPath = path.join(appDir, '.electron')

  if (test('-d', electronPath)) {
    Console.warn()
    Console.labelWarn('This will delete .electron/ and its contents. Are you sure you want to continue? (Y/N)')

    process.stdin.setEncoding('utf8')
    process.stdin.on('data', function (text) {
      if (/y/i.test(text)) {
        rm('-rf', electronPath)
        Console.info('Removed electron files')
        process.exit(1)
      } else if (/n/i.test(text)) {
        process.exit(1)
      }
    })
  } else {
    Console.info('Nothing to remove')
  }
}

Desktop.packageApp = function (opts) {
  var appDir = process.platform === 'win32' && files.convertToWindowsPath(opts.appDir) || opts.appDir


  var packager = checkModuleAndDownload('electron-packager').wait().value
  var test = checkModuleAndDownload('shelljs').wait().value.test
  var out = path.join(appDir, '.electron', 'out')
  var src = path.join(appDir, '.electron', 'app')

  var hasElectronFolders = !!test('-d', out) && !!test('-d', src)

  if (!hasElectronFolders) throw new Error('ELECTRON_APP_NOT_FOUND')

    var packagerOptions = {
      dir: src,
      platform: opts.platform,
      arch: opts.targetArch,
      name: opts.name,
      version: opts.targetVersion,
      all: opts.all,
      overwrite: opts.overwrite,
      out: out,
      icon: opts.icon,
      'app-bundle-version': opts['app-bundle-version'],
      'app-version': opts['app-version'],
      cache: opts.cache,
      'helper-bundle-id': opts['helper-bundle-id'],
      ignore: opts.ignore,
      prune: opts.prune,
      asar: opts.asar,
      sign: opts.sign,
      overwrite: opts.overwrite,
      'version-string': opts['version-string']
    }

  Console.info(opts)

  packager(packagerOptions, function (err, appPath) {
    if (err) return Console.error(err)

    if (!appPath.length) return

    Console.info()
    _.each(appPath, function (dir) {
      Console.info('Packaged up your Meteor app to ' + dir)
    })
  })
}

module.exports = Desktop
