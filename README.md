This class (tm1637.js) is designed to use the TM1637 led display driver with node js.
Because wiringPi is no longer available, I have decided to define a new class using pigpio to drive the TM1637 led display controller.

So, before using this class, it is necessary to install pigpio.
https://www.npmjs.com/package/pi-gpio

You have several examples to use this class :
- display a decimal number 
- display hex number
- display and scroll text (some letters are not available)

Example:
the command line 

sudo node decimalNumber.js  

will show you some possibilities.
