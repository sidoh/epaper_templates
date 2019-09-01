#!/bin/bash

server=$1
shift

for file in $@; do 
  echo "Uploading ${file}..."
  curl -s "${server}/bitmaps" -F filename=@${file}
done
