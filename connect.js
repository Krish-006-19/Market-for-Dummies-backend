const mongoose = require('mongoose')

async function Konnect(url){
    try {
        await mongoose.connect(url)
        console.log(`MongoDb Connected!`)
    } catch (error) {
        throw error
    }
}

module.exports = {
    Konnect
}