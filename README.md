# Monster UI Callflows

#### Installation to source files:
1. Upload files from directory `src` to directory with source files of your Monster UI (*near the folders "apps", "css" and "js"*)
2. Add next strings to file `/js/main.js` after string `paths: {`
``` javascript
'bootstraptour': 'js/vendor/bootstrap-tour.min',
```
3. Register `callflows` app
4. Build your Monster UI with original builder (command `gulp`)
5. Activate the Callflows app in the Monster UI App Store ( `/#/apps/appstore` )

#### Installation to compiled files:
1. Upload all folders and files from directory `src` to root directory of your Monster UI (*near the folders "apps", "css" and "js"*)
2. Create next symbol links in root directory of Monster UI
```bash
# ln [options] <target file> [link name]
ln -s js/vendor/bootstrap-tour.min.js bootstraptour.js
```
3. Register `callflows` app
4. Activate Callflows app in the Monster UI App Store ( `/#/apps/appstore` )