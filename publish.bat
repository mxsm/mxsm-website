@echo off
set pan=.\public\

set repo=git@github.com:mxsm/mxsm.github.io.git
set branch=master
if exist %pan% (

    echo "clean public directory"
    rd /S /Q %pan%
    echo "Hugo again for new site"
    hugo
) else (
    echo "can not find public directory"
    echo "Hugo again for new site"
    hugo
)
if exist %pan% (
    cd %pan%
    echo "git init and commit"
    git init
    git add -A
    git commit -m "update site at %time%"
    echo "set remote repository and push"
    git remote add origin %repo%
    git push -f origin master:master -v
) else (
    echo "can not find public directory, hugo fail!"
)
pause