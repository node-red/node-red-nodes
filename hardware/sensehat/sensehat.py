#! /usr/bin/python
#
# Copyright 2016 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Commands:
#  C[R,G,B] - clear to colour (or off if no RGB provided)
#  R[rot] - rotate by rot (0,90,180,270)
#  P[x,y,R,G,B]+ - set individual pixel(s) to a colour
#  T[R,G,B:]Message - scroll a message (nb: if message contains ':' it must be prefixed with ':')
#  F[H|V] - flip horizontal|vertical
#  X[0|1] - high frequency reporting (accel/gyro/orientation/compass) off|on
#  Y[0|1] - low frequency reporting (temperature/humidity/pressure) off|on
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
import select
import struct

from sense_hat import SenseHat

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
          if e.errno != errno.ENOENT:
              raise
  raise RuntimeError('unable to locate SenseHAT joystick device')


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


def process_command(data):
  global hf_enabled, lf_enabled
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
    data = data[1:].strip()
    col = (255,255,255)
    s = data.split(':',1)
    if len(s) == 2:
      data = s[1]
      if len(s[0]) > 0:
        c = s[0].split(",")
        col = (int(c[0]),int(c[1]),int(c[2]))
    SH.show_message(data,text_colour=col)
  elif data[0] == "F":
    if data[1] == "H":
      SH.flip_h()
    elif data[1] == "V":
      SH.flip_v()
  elif data[0] == "X":
    if data[1] == '0':
      hf_enabled = False
    else:
      hf_enabled = True
  elif data[0] == "Y":
    if data[1] == '0':
      lf_enabled = False
    else:
      lf_enabled = True

def idle_work():
  global last_hf_time, last_lf_time
  now = time.time()
  if hf_enabled and (now-last_hf_time > hf_interval):
    orientation = SH.get_orientation()
    compass = SH.get_compass()
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

try:
    main_loop()
except KeyboardInterrupt:
  pass
