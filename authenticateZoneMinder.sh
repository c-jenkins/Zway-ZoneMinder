#!/bin/sh
curl -d "username=${1}&password=${2}&action=login&view=console" -c /tmp/cookies.txt ${3}/zm/index.php > /dev/null 2>&1
cat /tmp/cookies.txt | grep ZMSESSID | cut -f 6-7 | tr '\t' =

