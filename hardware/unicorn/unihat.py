#!/usr/bin/python

# Import library functions we need
import sys
import os
import unicornhat as UH

if sys.version_info >= (3,0):
    print("Sorry - currently only configured to work with python 2.x")
    sys.exit(1)

brightness = float(sys.argv[1])/100
UH.off()
UH.brightness(brightness)

while True:
    try:
        data = raw_input()
        if len(data) < 10:
            if data[0] == "B":
                UH.brightness(float(data[1:])/100)
            if data[0] == "R":
                UH.rotation(float(data[1:]))
        else:
            if data[0] == "P":
                data = data[1:].strip()
                s = data.split(',')
                for p in range(0,len(s),5):
                    x1 = 0
                    x2 = 0
                    y1 = 0
                    y2 = 0
                    if s[p] == "*":
                        x1 = 0
                        x2 = 8
                    elif "-" in s[p]:
                        x1 = int(s[p].split('-')[0]) % 8
                        x2 = int(s[p].split('-')[1]) % 8 + 1
                        if x1 >= x2:
                            x2,x1 = x1+1,x2-1
                    else:
                        x1 = int(s[p])
                        x2 = int(s[p])+1
                    if s[p+1] == "*":
                        y1 = 0
                        y2 = 8
                    elif "-" in s[p+1]:
                        y1 = int(s[p+1].split('-')[0]) % 8
                        y2 = int(s[p+1].split('-')[1]) % 8 + 1
                        if y1 >= y2:
                            y2,y1 = y1+1,y2-1
                    else:
                        y1 = int(s[p+1]) % 8
                        y2 = int(s[p+1]) % 8 + 1
                    for i in range(x1,x2):
                        for j in range(y1,y2):
                            UH.set_pixel(i,j,int(s[p+2]),int(s[p+3]),int(s[p+4]))
            else:
                q = 0
                for p in range(64):
                    UH.set_pixel(p%8,int(p/8),ord(data[q]),ord(data[q+1]),ord(data[q+2]))
                    q += 3
            UH.show()
    except (EOFError, SystemExit):  # hopefully always caused by us sigint'ing the program
        sys.exit(0)
    except Exception as ex:
        print "bad data: "+data
