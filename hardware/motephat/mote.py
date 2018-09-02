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
        for p in range(0,len(s),5):

          # Parse channel indicies
          c1 = 0
          c2 = 0
          if s[p] == "*":
            c1 = 0
            c2 = 4
          elif "-" in s[p]:
            c1 = int(s[p].split('-')[0]) % 4
            c2 = int(s[p].split('-')[1]) % 4 + 1
            if c1 >= c2:
              c2,c1 = c1+1,c2-1
          else:
            c1 = int(s[p])
            c2 = int(s[p])+1
          
          # print(str(c1) +" "+ str(c2))

          # Parse pixel indicies
          x1 = 0
          x2 = 0
          if s[p+1] == "*":
            x1 = 0
            x2 = 16
          elif "-" in s[p+1]:
            x1 = int(s[p+1].split('-')[0]) % 16
            x2 = int(s[p+1].split('-')[1]) % 16 + 1
            if x1 >= x2:
              x2,x1 = x1+1,x2-1
          else:
            x1 = int(s[p+1]) % 16
            x2 = int(s[p+1]) % 16 + 1
            
          # print(str(x1) +" "+ str(x2))

          # Draw pixels
          for c in range(c1,c2):
            for x in range(x1,x2):
              # print(str(c+1) +" "+ str(x) +" "+ s[p+2] +" "+ s[p+3] +" "+ s[p+4])
              motephat.set_pixel(c+1,x,int(s[p+2]),int(s[p+3]),int(s[p+4]))
      
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