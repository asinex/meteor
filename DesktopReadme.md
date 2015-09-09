#Meteor tool extended with desktop support
##How to get / use:
Execute the following in your terminal:

`meteor --release jrudio:METEOR@1.1.0 add-desktop`

It will take a few minutes to download the tool and initialize files / folders

Then, run it with:

`meteor --release jrudio:METEOR@1.1.0 run-desktop`

Finally, when you want to build the client:

`meteor --release jrudio:METEOR@1.1.0 build-desktop`

The options are:

```bash
# Defaults to current machine platform
--platform='linux'
# Defaults to current machine architecture
--targetArch='x64'
# Default
--targetVersion='0.31.1'
# Defaults to MeteorDesktopApp
--name='MyDesktopApp'
```

If you just want to get rid of the desktop files run:

`meteor --release jrudio:METOR@1.1.0 remove-desktop`
