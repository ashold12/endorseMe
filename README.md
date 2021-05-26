# endorseMe
Node.js script utilizing Puppeteer which will endorse all skills for all the given people supplied to it

<b>Instructions</b>

1. Clone down the repo to your local machine
2. Run npm install or install puppeteer which is the only dependency assuming node is installed
3. Paste LinkedIn URL's into the ```raw``` variable in ```list.js``` file. separate each link with a new line and keep in a template literal
4. Rename config_example.js to config.js and change the ```user``` and ```password``` variables to your respective username and password for LinkedIn
5. Run the start script via ```npm start``` and watch the endorsements gooooooooo


<b>NOTE:</b>
If you run this on an extensively long list LinkedIn may start denying your request with 429 codes (Too many requests). Takes quite a bit but it can happen

This is a prototype that is still in development. Eventually this will be compiled to an executable which I will provide a download link to on this repo's page



