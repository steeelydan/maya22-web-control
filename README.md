# ESI Maya 22 Web Control

Simple, browser-based GUI to control the ancient ESI Maya 22 USB audio interface on Linux.

![Screenshot](docs/screenshot.png)

## Installation

-   `Node.js` must be installed
-   Build the command line Maya22 control app by `rabits`: Follow instructions on https://github.com/rabits/esi-maya22-linux
-   Clone this repository
-   Install dependencies: `npm install`
-   Create a file containing the path to the control app executable named `.clipath`
    -   Example content: `/usr/local/bin/maya22-control`
-   `npm start`
-   Now you can open the web GUI at http://localhost:9999
