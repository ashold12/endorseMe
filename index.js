#!/usr/bin/env node
const chalk = require('chalk')
const puppeteer = require('puppeteer')
const clear = require('clear')
const figlet = require('figlet')
const inquirer = require ('inquirer')

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
console.log(
  chalk.red('Created by Alexander Shold of RFP51:\n') +
  chalk.red.underline.bold('https://www.linkedin.com/in/alexander-shold/') +
  chalk.red(' | ') +
  chalk.red.underline.bold('ashold12@gmail.com\n\n')
)

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
    name: 'connect',
    type: 'list',
    message: 'Do you want to send a connection request to unconnected users?',
    choices:['Yes', 'No']
  },
  {
    name: 'list',
    type: 'editor',
    message: 'Enter the url\'s of the users you wish to endorse separated by line',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Enter the url\'s of the users you wish to endorse separated by line';
      }
    }
  },
]);


//process code
let browser = puppeteer.launch({headless: true}) //remove headless on final
  .then(async (browser) => {
    try {
      let data = await promptInfo()
      console.log(`Attemping login.....`)
      let { list, username, password, connect } = data
      connect === 'Yes' ? connect = true : connect = false
      list = list.split('\n')
      list = list.filter(url => url.length)
      let login = {user: username, password}
      let page = await browser.newPage()
      await page.setViewport({
        width: 1280,
        height: 800,
        isMobile: false,
      });

      await page.goto("http://linkedin.com", {waitUntil: "networkidle2"});

      await page.waitForSelector('input[name="session_key"]')
      await page.waitForTimeout(1000)
      await page.type('input[name="session_key"]', login.user, {
        delay: 10,
      });
      await page.type('input[name="session_password"]', login.password, {
        delay: 10,
      });
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000)
      let url = await page.url()
      if (
        url === 'https://www.linkedin.com/uas/login-submit' ||
        url === 'https://www.linkedin.com/'
        ) {
          console.log('Invalid Login Information')
          return
        }
      console.log('Successful Login')
      /* list.forEach(async (userUrl) => { */
      let failed = []
      let successes = 0
      await asyncForEach(list, async (userUrl, index) => {
        if (!userUrl) return
        if (!(userUrl.includes('https://') || userUrl.includes('http://'))) userUrl = 'https://' + userUrl
        await page.goto(userUrl, { waitUntil: "networkidle2" });
        if (page.url() === 'https://www.linkedin.com/in/unavailable/') return
        await page.waitForSelector('div[class="profile-detail"]')
        // console.log('Profile details loaded!')
        let name = await page.title()
        name = name.substring(0, name.length - 11)
        console.log(`Serving Profile ${index+1}/${list.length} - ${name}`)
        let connection = await page.evaluate(() => {
          let notConnected = document.querySelector('button[data-control-name="connect"]')
          let pending = document.querySelector('button[class="pvs-profile-actions__action artdeco-button artdeco-button--2 artdeco-button--primary artdeco-button--disabled ember-view"]')
          notConnected ? notConnected = true : notConnected = false
          pending ? pending = true : pending = false
          return {notConnected, pending}
        })
        if (connection.notConnected) {
          if (!connection.pending && connect) {
            await page.click('button[data-control-name="connect"]');
            await page.waitForSelector('button[class="ml1 artdeco-button artdeco-button--3 artdeco-button--primary ember-view"]')
            await page.click('button[class="ml1 artdeco-button artdeco-button--3 artdeco-button--primary ember-view"]')
            console.log('User not connected - Connection request sent')
          } else if (connection.pending) {
            console.log('User not connected - Connection request pending')
          } else {
            console.log('User not connected')
          }
          await page.waitForTimeout(1000)
          return
        }

        let buttonFound = null
        let lastScroll = 0
        while (buttonFound === null) {
          await page.waitForTimeout(5)
          await page.evaluate(() => { window.scrollTo(0, window.scrollY+10) })
          let buttonPresent = await page.evaluate(() => {
            return document.querySelector('button[data-control-name="skill_details"]') ? true : false
          })
          let scrollFinished = await page.evaluate((lastScroll) => {
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
        await page.waitForTimeout(1000)
        if (success) successes++
        else failed.push(userUrl)
        return
      })
      console.log(`Successful Endorsements ${successes}`)
      console.log(`Failed Endorsements ${failed.length} on:`)
      failed.forEach(url => console.log(url))
      return
    } catch (err) { console.error(err) }
    finally { await browser.close() }
  })
  .catch((err) => {
    console.error(err)
  })





