#!/bin/sh
wget http://registry.npmjs.org/pty.js/-/pty.js-0.1.2.tgz 
mv pty.js-0.1.2.tgz local_modules/
cd local_modules; rm -rf package; tar xzvf pty.js-0.1.2.tgz; cd package; patch -p1 <../pty.js-0.1.2.patch
cd ../../ 
for i in $(find ./local_modules -maxdepth 1 -type d) ; do
    packageJson="${i}/package.json"
    if [ -f "${packageJson}" ]; then
        echo "installing ${i}..."
        npm install "${i}"
    fi
done
