#! /usr/bin/python

# Commands:
#  C[R,G,B] - clear to colour (or off if no RGB provided)
#  R[rot] - rotate by rot (0,90,180,270)
#  P[x,y,R,G,B]+ - set individual pixel(s) to a colour
#  T[R,G,B[,R,G,B][,S]:]Message - scroll a message (nb: if message contains ':' it must be prefixed with ':')
#                                 if message is a single char, uses show_letter instead
#  F[H|V] - flip horizontal|vertical
#  X[0|1] - high frequency reporting (accel/gyro/orientation/compass) off|on
#  Y[0|1] - low frequency reporting (temperature/humidity/pressure) off|on
#  D[0|1] - Set light level low|high
#
# Outputs:
#  Xaccel.x,y,z,gyro.x,y,z,orientation.roll,pitch,yaw,compass
#  Ytemperature,humidity,pressure
#  K[U|L|R|D|E][0|1|2] - joystick event:  direction,state

import io
import os
import sys
import glob
import time
import errno
import ctypes
import select
import struct
import inspect
import threading

from sense_hat import SenseHat

try:
    StandardError              # Python 2
except NameError:
    StandardError = Exception  # Python 3


EVENT_FORMAT = 'llHHI'
EVENT_SIZE = struct.calcsize(EVENT_FORMAT)
EVENT_NAMES = {103:'U',105:'L',106:'R',108:'D',28:'E'}

def get_stick():
  for evdev in glob.glob('/sys/class/input/event*'):
      try:
          with io.open(os.path.join(evdev, 'device', 'name'), 'r') as f:
              if f.read().strip() == 'Raspberry Pi Sense HAT Joystick':
                  return os.path.join('/dev', 'input', os.path.basename(evdev))
      except IOError as e:
          sys.exit(1)
  sys.exit(1)



stick_file = io.open(get_stick(),'rb')

SH = SenseHat()
SH.set_rotation(0)
SH.clear()

files = [sys.stdin,stick_file]
last_hf_time = time.time()
last_lf_time = time.time()

hf_interval = 0.09 # Approx 10/s
lf_interval = 1

hf_enabled = False
lf_enabled = False

scroll = None

class ScrollThread(threading.Thread):
  def __init__(self,fcol,bcol,speed,message):
    threading.Thread.__init__(self)
    self.fcol = fcol
    self.bcol = bcol
    self.message = message
    self.speed = speed

  def run(self):
    global SH
    old_rotation = SH.rotation

    try:
      SH.show_message(self.message,text_colour=self.fcol,back_colour=self.bcol,scroll_speed=self.speed)
    except:
      try:
        SH.set_rotation(old_rotation,False)
        SH.clear(self.bcol);
      except:
        pass

  def interrupt(self):
    if not self.isAlive():
      raise threading.ThreadError()
    for thread_id, thread_object in threading._active.items():
      if thread_object == self:
        r = ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id,ctypes.py_object(StandardError))
        if r == 1:
          pass
        else:
          if r > 1:
            ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id, 0)
          raise SystemError()
        return




def process_command(data):
  global hf_enabled, lf_enabled,scroll

  if data[0] == "X":
    if data[1] == '0':
      hf_enabled = False
    else:
      hf_enabled = True
  elif data[0] == "Y":
    if data[1] == '0':
      lf_enabled = False
    else:
      lf_enabled = True
  elif data[0] == "D":
    if data[1] == '0':
      SH.low_light = True
    else:
      SH.low_light = False
  else:
    if threading.activeCount() == 2:
      scroll.interrupt()
      while scroll.isAlive():
          time.sleep(0.01)
          try:
            scroll.interrupt()
          except:
            pass
    if data[0] == "R":
      SH.set_rotation(float(data[1:]))
    elif data[0] == "C":
      data = data[1:].strip()
      if len(data) > 0:
          s = data.split(",")
          col = (int(s[0]),int(s[1]),int(s[2]))
      else:
          col = (0,0,0)
      SH.clear(col)
    elif data[0] == "P":
      data = data[1:].strip()
      s = data.split(',')
      for p in range(0,len(s),5):
        SH.set_pixel(int(s[p]),int(s[p+1]),int(s[p+2]),int(s[p+3]),int(s[p+4]))
    elif data[0] == "T":
      data = data[1:]
      tcol = (255,255,255)
      bcol = (0,0,0)
      speed = 0.1
      s = data.split(':',1)
      if len(s) == 2:
        data = s[1][0:-1]
        if len(s[0]) > 0:
          c = s[0].split(",")
          if len(c) == 1:
            speed = float(c[0])
          elif len(c) == 3:
            tcol = (int(c[0]),int(c[1]),int(c[2]))
          if len(c) == 4:
            tcol = (int(c[0]),int(c[1]),int(c[2]))
            speed = float(c[3])
          elif len(c) == 6:
            tcol = (int(c[0]),int(c[1]),int(c[2]))
            bcol = (int(c[3]),int(c[4]),int(c[5]))
          elif len(c) == 7:
            tcol = (int(c[0]),int(c[1]),int(c[2]))
            bcol = (int(c[3]),int(c[4]),int(c[5]))
            speed = float(c[6])
      if len(data) > 1:
        scroll = ScrollThread(tcol,bcol,speed,data);
        scroll.start()
      else:
        SH.show_letter(data,text_colour=tcol,back_colour=bcol)
    elif data[0] == "F":
      if data[1] == "H":
        SH.flip_h()
      elif data[1] == "V":
        SH.flip_v()

def idle_work():
  global last_hf_time, last_lf_time
  now = time.time()
  if hf_enabled and (now-last_hf_time > hf_interval):
    orientation = SH.get_orientation()
    # Calling get_compass interferes with get_orientation - so just reuse its value
    compass = orientation['yaw']
    gyro = SH.get_gyroscope_raw()
    accel = SH.get_accelerometer_raw()

    print("X%0.4f,%0.4f,%0.4f,%0.4f,%0.4f,%0.4f,%0.4f,%0.4f,%0.4f,%0.0f"%(accel['x'],accel['y'],accel['z'],gyro['x'],gyro['y'],gyro['z'],orientation['roll'],orientation['pitch'],orientation['yaw'],compass))
    last_hf_time = now
  if lf_enabled and (now-last_lf_time > lf_interval):
    temperature = SH.get_temperature();
    humidity = SH.get_humidity();
    pressure = SH.get_pressure();
    print("Y%0.2f,%0.2f,%0.2f"%(temperature,humidity,pressure))
    last_lf_time = now

def process_joystick():
  event = stick_file.read(EVENT_SIZE)
  (tv_sec, tv_usec, type, code, value) = struct.unpack(EVENT_FORMAT, event)
  if type == 0x01:
    print ("K%s%s"%(EVENT_NAMES[code],value))

def main_loop():
  # while still waiting for input on at least one file
  try:
    while files:
      ready = select.select(files, [], [], 0.01)[0]
      if not ready:
        idle_work()
      else:
        for file in ready:
          if file == sys.stdin:
            line = file.readline()
            if not line: # EOF, remove file from input list
              sys.exit(0)
            elif line.rstrip(): # optional: skipping empty lines
              process_command(line)
          else:
            process_joystick()
  except:
    sys.exit(0)

try:
    main_loop()
except KeyboardInterrupt:
  pass
