const puppeteer = require('puppeteer')
const { login } = require('./config.js')
const { list } = require('./list.js')

let browser = puppeteer.launch({headless: false}) //remove headless on final
  .then(async (browser) => {
    let page = await browser.newPage()
    await page.setViewport({
      width: 1280,
      height: 800,
      isMobile: false,
    });

    page.goto("http://linkedin.com", {
      waitUntil: "networkidle2",
    });

    await page.waitFor('input[name="session_key"]')
    await page.waitFor(1000)
    await page.type('input[name="session_key"]', login.user, {
      delay: 10,
    });
    await page.type('input[name="session_password"]', login.password, {
      delay: 10,
    });
    await page.click('button[type="submit"]');
    await page.waitFor(1000)
    const url = await page.url()
    if (
      url === 'https://www.linkedin.com/uas/login-submit' ||
      url === 'https://www.linkedin.com/'
      ) {
        console.log('Invalid Login Information')
        await browser.close()
        return
      }
    console.log('Successful Login')
  })
  .catch((err) => {
    console.error(err)
  })





