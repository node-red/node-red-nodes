#!/bin/bash

python -c "import sense_hat" 2> /dev/null

if [ $? -ne 0 ]
then
    echo "WARNING : Can't find Sense HAT python library"
    echo "WARNING : Please install using the following commands"
    echo "WARNING :   sudo apt-get update"
    echo "WARNING :   sudo apt-get install sense-hat"
    echo "WARNING :   sudo pip-3.2 install pillow"
else
    echo "Sense HAT python library is installed"
fi
