#!/bin/sh
for i in $(find ./local_modules -maxdepth 1 -type d) ; do
    packageJson="${i}/package.json"
    if [ -f "${packageJson}" ]; then
        echo "installing ${i}..."
        npm install "${i}"
    fi
done
