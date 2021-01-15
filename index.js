const express = require('express')
const config = require('config')

const app = express()

const rateLimit = require("express-rate-limit");
 
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 30 minutes
  max: 3 // limit each IP to 3 requests per windowMs
});

app.use(limiter);


app.get('/', (req, res) => {
    res.send('Your server is working')
})


const action = require('./action')


app.get('/contest', action.contest)
app.post('/notification', action.admin_only, action.set_notification)
app.post('/message', action.admin_only, action.set_message)
app.get('/notification', action.admin_only, action.get_notification)
app.get('/message', action.admin_only, action.get_message)
app.post('/server-state', action.admin_only, action.server_state)

app.get('/dummy', action.dummy)


app.listen(process.env.PORT || config.get('PORT'), () => {
    console.log('app started')
})
