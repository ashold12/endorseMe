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

    page.goto("http://linkedin.com", {waitUntil: "networkidle2"});

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
    let url = await page.url()
    if (
      url === 'https://www.linkedin.com/uas/login-submit' ||
      url === 'https://www.linkedin.com/'
      ) {
        console.log('Invalid Login Information')
        await browser.close()
        return
      }
    console.log('Successful Login')
    list.forEach(async (userUrl) => {
      page.goto(userUrl, { waitUntil: "networkidle2" });
      if (page.url() === 'https://www.linkedin.com/in/unavailable/') return
      await page.waitFor('button[data-control-name="skill_details"]')
      await page.click('button[data-control-name="skill_details"]')
      page.waitForNavigation();
      await page.evaluate(() => {
        let elements = document.getElementsByClassName('pv-skill-entity__featured-endorse-button-shared')
        for (let x = 0; x < elements.length; x++) {
          elements[x].click()
        }
      });
    })
  })
  .catch((err) => {
    console.error(err)
  })





