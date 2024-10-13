const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/login-signup");

connect.then(() => {
   console.log("Database Connected Successfully");
})
.catch(() => {
   console.log("Database cannot be conncected");
});

const LoginSchema = new mongoose.Schema({
   name: {
       type: String,
       required: true
   },
   password: {
       type: String,
       required: true
   },
   role: {
       type: String,
       required: true,
       enum: ['patient', 'doctor']
   },
   transcripts: {
       type: [String],
       default: []
   },
   summarizedDiagnosis: {
       type: String,
       default: ''
   },
   treatmentSteps: {
       type: [String],
       default: []
   },
   appointmentSchedule: {
       type: String,
       default: ''
   },
   prescribedMedication: {
       type: [String],
       default: []
   }
})

const collection = new mongoose.model("users", LoginSchema);

module.exports = collection;