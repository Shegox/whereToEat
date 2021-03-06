# WhereToEat

This Slack Integration helps you decide where to eat and what's available in SAP Palo Alto's cafes with a few simple commands!

```sh
/cafe [Cafe Number (1,3, or 8)] [Preference Tag (-v,-vg,-ng)] f.e 1 -vg
/wheretoeat [Type of Food] [Preference Tag] f.e Taco -v 
/orderburger [Cafe Number] [Food Description] f.e 1 Tilapia with fries and veggies
```
| Tag | Description |
| ------ | ------ |
| -v | Vegetarian |
| -vg | Vegan |
| -ng | Non-Gluten |

# Add this to my slack team
Just press the link below and add the integration to your team.
https://slack.com/oauth/authorize?&client_id=215127220999.214921194070&scope=commands

# Install the application on my server
- installl nodejs and try to run the application. Install all needed dependencies
- create a slack app with 3 slashcommands. Point these slashcommands to your server on the following routes `/cafe`, `/wheretoeat` and   `orderburger`
- it is recommanded to run the app.js script with the forever command (must be installed)

# The future 
- Dynamic updating of the menus
- Getting a test run for the orderburger feature
- Better Error handling
- Voice Assistant implementations
- Natural Language Processing
