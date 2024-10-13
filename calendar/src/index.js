require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const {google} = require('googleapis');

const app = express();
const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.SECRET_ID, process.env.REDIRECT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type:'offline',
        scope:'https://www.googleapis.com/auth/calendar'
    });
    res.redirect(url);
})

app.get('/redirect', (req, res) => {
    const code = req.query.code;
    oauth2Client.getToken(code, (err, tokens) => {
        if(err) {
            console.error('Could not get token', err);
            res.send('Error');
            return;
        }
        oauth2Client.setCredentials(tokens);
        res.send('Successfully logged in');
    })
})

app.get('/calendars', (req, res) => {
    const calendar = google.calendar({version:'v3',auth:oauth2Client});
    calendar.calendarList.list({}, (err, response) => {
        if (err) {
            console.error('error fetching calenders', err);
            res.end('Error!');
            return;
        }
        const calendars = response.data.items;
        res.json(calendars);
    });
})

app.get('/events', (req, res) => {
    const calendarId = req.query.calendar??'primary';
    const calendar = google.calendar({version:'v3',auth:oauth2Client});
    calendar.events.list({
        calendarId,
        timeMin:(new Date()).toISOString(),
        maxResults:15,
        singleEvents:true,
        orderBy:'startTime'
    }, (err, response) => {
        if (err) {
            console.error('Cannot fetch events');
            res.send('Error');
            return;
        }
        const events = response.data.items;
        res.json(events);
    })
})

app.post('/create-event', (req, res) => {
    const calendar = google.calendar({version: 'v3', auth: oauth2Client});
    
    const { summary, description, startDateTime, endDateTime, timeZone } = req.body;
  
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          {method: 'popup', minutes: 5},
        ],
      },
    };
  
    calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    }, (err, event) => {
      if (err) {
        console.error('Error creating event:', err);
        res.status(500).json({
          error: 'Error creating event',
          details: err.message,
          code: err.code
        });
        return;
      }
      console.log('Event created:', event.data);
      res.status(200).json(event.data);
    });
  });

app.listen(8000, () => console.log('Server running at 8000'));