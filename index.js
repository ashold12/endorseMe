const chalk = require('chalk')
const puppeteer = require('puppeteer')
const clear = require('clear')
const figlet = require('figlet')
const inquirer = require ('inquirer')
// const { login } = require('./config.js')
// const { list } = require('./list.js')

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    try {
      await callback(array[index], index, array);
    }
    catch (err) { console.error(err) }
  }
}
clear()
console.log(
  chalk.yellow(
    figlet.textSync('EndorseMe', { horizontalLayout: 'full' })
  )
);
console.log(chalk.red('Created by Alexander Shold of RFP51: ') + chalk.red.underline.bold('https://www.linkedin.com/in/alexander-shold/\n\n'))

let promptInfo = async() => inquirer.prompt([
  {
    name: 'username',
    type: 'input',
    message: 'Enter your LinkedIn e-mail address:',
    validate: function(value) {
      const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (re.test(value.toLowerCase())) {
        return true;
      } else {
        return 'Please enter your LinkedIn e-mail address.';
      }
    }
  },
  {
    name: 'password',
    type: 'password',
    message: 'Enter your password:',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your password.';
      }
    }
  },
  {
    name: 'list',
    type: 'editor',
    message: 'Enter the url\'s of the users you wish to endorse eparated by line',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your password.';
      }
    }
  }
]);


//process code
let browser = puppeteer.launch({headless: false, devtools: true}) //remove headless on final
  .then(async (browser) => {
    try {
      let data = await promptInfo()
      let { list, username, password } = data
      list = list.split('\n')
      let login = {user: username, password}
      console.log(list)
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
      /* list.forEach(async (userUrl) => { */
      let failed = []
      let successes = 0
      await asyncForEach(list, async (userUrl) => {
        if (!userUrl) return
        page.goto(userUrl, { waitUntil: "networkidle0" });
        if (page.url() === 'https://www.linkedin.com/in/unavailable/') return
        await page.waitFor('div[class="profile-detail"]')
        console.log('Profile details loaded!')
        let connection = await page.evaluate(() => {
          let element = document.querySelector('button[data-control-name="connect"]')
          return element ? false : true
        })
        if (!connection) {
          console.log('User is not yet connected')
          await page.waitFor(1000)
          return
        }

        let buttonFound = null
        let lastScroll = 0
        while (buttonFound === null) {
          page.evaluate(() => { window.scrollTo(0, window.scrollY+15) })
          let buttonPresent = await page.evaluate(() => {
            return document.querySelector('button[data-control-name="skill_details"]') ? true : false
          })
          let scrollFinished = await page.evaluate((lastScroll) => {
            console.log(`current: ${window.scrollY} last: ${lastScroll}`)
            let finished = window.scrollY === lastScroll
            return {finished, lastScroll: window.scrollY}
          }, lastScroll)
          lastScroll = scrollFinished.lastScroll
          if (buttonPresent) {
            buttonFound = true
            continue
          }
          if (scrollFinished.finished) buttonFound = false
        }

        console.log(`found button: ${buttonFound}`)
        console.log('finished search')
        if (!buttonFound) {
          console.error(`could not locate expand skills button`)
          failed.push(userUrl)
          return
        }
        await page.click('button[data-control-name="skill_details"]')
        let success = await page.evaluate(() => {
          let skillsDiv = document.getElementById('skill-categories-expanded')
          if (skillsDiv) skillsDiv.scrollIntoView(true)
          else document.querySelector('button[data-control-name="skill_details"]').click()
          skillsDiv = document.getElementById('skill-categories-expanded')
          if (skillsDiv) skillsDiv.scrollIntoView(true)
          else return false
          let elements = document.getElementsByClassName('pv-skill-entity__featured-endorse-button-shared artdeco-button--secondary')
          for (let x = 0; x < elements.length; x++) {
            elements[x].click()
          }
          return true
        });
        await page.waitFor(1000)
        if (success) successes++
        else failed.push(userUrl)
        return
      })
      console.log(`Successful Endorsements ${successes}`)
      console.log(`Failed Endorsements ${failed.length} on ${JSON.stringify(failed)}`)
      return
    } catch (err) { console.error(err) }
    finally { await browser.close() }
  })
  .catch((err) => {
    console.error(err)
  })





