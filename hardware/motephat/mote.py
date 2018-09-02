#!/usr/bin/env python

# Commands:
#  B[br] - set the global brightness level
#  C[c] - clear a specific channel (or all channels if no channel provided)
#  F[r,g,b] - fill all pixels to a colour
#  P[c,p,r,g,b]+ - set individual pixel(s) to a colour
#  [r,g,b]+ - set all pixels to a colour

# Import library functions we need
import sys
import time

try:
  import motephat
except ImportError:
  print("run: curl https://get.pimoroni.com/motephat | bash\n before trying again.")
  sys.exit(0)

try:
  raw_input          # Python 2
except NameError:
  raw_input = input  # Python 3

motephat.configure_channel(1, 16, False)
motephat.configure_channel(2, 16, False)
motephat.configure_channel(3, 16, False)
motephat.configure_channel(4, 16, False)

motephat.set_brightness(float(sys.argv[1])/100)

def parseRange(str, rangeMax):

  # Test for : syntax
  if ":" in str:
    return map(int, str.split(":"))

  # Test for wildcard
  if str == "*":
    return list(range(rangeMax))
  
  # Test for range
  if "-" in str:
    i1 = int(str.split('-')[0]) % rangeMax
    i2 = int(str.split('-')[1]) % rangeMax + 1
    if i1 >= i2:
      i2,i1 = i1+1,i2-1
    return list(range(i1, i2))
  
  # Assuming single index
  i1 = int(str)
  i2 = int(str)+1
  return list(range(i1, i2))

while True:
  try:
    data = raw_input()
    if len(data) > 0:
    
      # Brightness
      if data[0] == "B":
        motephat.set_brightness(float(data[1:])/100)
      
      # Clear
      elif data[0] == "C":
        if len(data) > 1:
          motephat.clear_channel(int(data[1:]))
        else:
          motephat.clear()

      # Fill
      elif data[0] == 'F':
        data = data[1:].strip()
        s = data.split(',')
        motephat.set_all(int(s[0]), int(s[1]), int(s[2]))
      
      # Pixels
      elif data[0] == "P":
        data = data[1:].strip()
        s = data.split(',')

        # c syntax
        if (len(s) % 3 == 1):
          cRange = parseRange(s[0], 4)
          m = (len(s)-1)
          for c in cRange:
            q = 0
            for x in range(16):
              motephat.set_pixel(c+1,x,int(s[q+1]),int(s[q+2]),int(s[q+3]))
              q += 3
              if (q >= m):
                q = 0

        # c + x syntax
        elif (len(s) % 5 == 0):
          for p in range(0,len(s),5):
            cRange = parseRange(s[p], 4)
            xRange = parseRange(s[p+1], 16)
            for c in cRange:
              for x in xRange:
                motephat.set_pixel(c+1,x,int(s[p+2]),int(s[p+3]),int(s[p+4]))

        # full buffer 
        elif (len(s) == 192):
          q = 0
          for p in range(64):
            motephat.set_pixel(int(p/16)+1,p%16,data[q],data[q+1],data[q+2])
            q += 3

      # Complete pixel buffer
      else:
        q = 0
        for p in range(64):
          motephat.set_pixel(int(p/16)+1,p%16,ord(data[q]),ord(data[q+1]),ord(data[q+2]))
          q += 3
      
      # Draw an update
      motephat.show()

  except (EOFError, SystemExit):  # hopefully always caused by us sigint'ing the program
    sys.exit(0)

  except Exception as ex:
    print(ex)
    print("bad data: "+data)