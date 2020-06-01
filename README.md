# WatchMeType

A web app that allows you to type using nothing but your finger and a leap motion. Created as a demo for what the leap motion could do for typing on a smartwatch.

## Installation

First of all make sure you have a [Leap Motion](https://www.leapmotion.com/) plugged in and you have installed its associated software.

To get started, clone, (install NPM) and run ```npm install```.

To run the server, run ```node run``` and navigate to http://localhost:1234/

Use the URL to enter any parameters like this http://localhost:1234/#{parameters}
The parameters should be seperated by dashes and can be in any order. For example:
http://localhost:1234/#d-dot-showtutorial

## Parameters

* D: Debug mode, mouse functions as cursor instead of leap-motion
* Dutch: Chooses the dutch language pack
* English: Chooses the english language pack (default)
* Dot: Show a red dot that represents the cursor
* Showtutorial: Show the tutorial
