const axios = require('axios')
const cache = require('cache')
const dayjs = require('dayjs')
const config = require('config')


const cache_memory = new cache( config.get('TTL') )

let notificationStore = null, messageStore = null;
let serverRunning = true;


const rewrite_data = (data) => {

    data.objects.forEach(element => {
        delete element.resource 
        delete element.id
        element.div = null
        const div_string = element.event.match(/Div. \d/g)[0]
        if(div_string.length){
            element.div = parseInt(div_string.substring(5, div_string.length))
        }
    });

    delete data.meta.previous
    delete data.meta.next
    delete data.meta.offset

    data.contests = data.objects
    delete data.objects

    if(notificationStore){
        data.notification = notificationStore
    }

    if(messageStore){
        data.message = messageStore
    }
}


module.exports.contest = async (req, res) => {
    try{
        if(!serverRunning){
            throw new Error('Server is not up')
        }
        let contest_data = await cache_memory.get('CONTEST_DATA')
        if(!contest_data){
            const start_day = dayjs().toISOString()
            const end_day = dayjs().add(7, 'd').toISOString()
            const url = `https://clist.by:443/api/v1/contest/?limit=${config.get('LIMIT')}&resource__id=1&start__gte=${start_day}&end__lte=${end_day}&${config.get('API_SECRET')}`
            const response = await axios.get(url)
            contest_data = rewrite_data(response.data)
            await cache_memory.put('CONTEST_DATA', contest_data)
        }
        res.send(contest_data)

    } catch(err){
        res.status(401).send({
            failed: true,
            error: err.message,
            message: messageStore,
            notification: notificationStore,
            server: serverRunning
        })
    }
}

module.exports.set_notification = (req, res) => {
    try{
        const title = req.query.title, message = req.query.message;
        if(!title || !message){
            notificationStore = null
        } else{
            notificationStore = {}
            notificationStore.title = title
            notificationStore.message = message
        }
        res.send(notificationStore)
    }catch(err){
        res.status(401).json({
            failed: true,
            error: err.message
        })
    }
}

module.exports.set_message = (req, res) => {
    try{
        const message = req.query.message, link = req.query.link;
        if(!message) {
            messageStore = null
        } else{
            // set actual data
            messageStore = {}
            messageStore.message = message
            messageStore.link = link
        }
        res.send(messageStore)
    }catch(err){
        res.status(401).json({
            failed: true,
            error: err.message
        })
    }
}

module.exports.admin_only = (req, res, next) => {
    const query = req.query.admin
    if(query == config.get('ADMIN_PASSCODE')) next()
    else {
        res.status(403).send()
    }
}

module.exports.get_notification = (req, res) => {
    res.send({
        notification: notificationStore
    })
}

module.exports.get_message = (req, res) => {
    res.send({
        message: messageStore
    })
}

module.exports.server_state = (req, res) => {
    let server_to_set = req.query.server_state
    if(server_to_set === "true") server_to_set = true
    else if(server_to_set === "false") server_to_set = false
    else server_to_set = serverRunning
    serverRunning = server_to_set
    res.send({
        server_state: serverRunning
    })
}