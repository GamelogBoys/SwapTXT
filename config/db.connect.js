const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Database connected")
})
.catch((err) => {
    console.log(err.message)
})

module.exports = mongoose
