import fetch from 'node-fetch'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { logReq, logRes, logErr, getRandomInt } from './utils/index.js'

const MODULE_NAME = 'TICKET_SALES'

let time = undefined
let multiplicator = undefined

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

setInterval(async () => {
	await updateTime()
}, 1000)

app.post('/BuyTickets', async (req, res) => {
	let requestedTicketsNumber = req.body.requestedTicketsNumber
	let tickets = req.body.tickets
	let newTickets = []
	const ticketsBought = []
	logReq('BuyTickets', { requestedTicketsNumber })

	logReq('AddTicketSalesEvent')
	await fetch('http://localhost:4007/AddTicketSalesEvent', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			type: 'passengers_came',
			requestedTicketsNumber,
		}),
	})

	if (requestedTicketsNumber) {
		for (let i = 0; i < tickets.length; i++) {
			if (
				new Date(new Date(tickets[i].time).getTime() - 20 * 60000) >
				new Date(time)
			) {
				const ticketsToBuyOnCurrentFlight = Math.min(
					tickets[i].amount,
					getRandomInt(requestedTicketsNumber)
				)
				if (ticketsToBuyOnCurrentFlight > 0) {
					ticketsBought.push({
						flight: tickets[i].flight,
						tickets: ticketsToBuyOnCurrentFlight,
					})
				}
				newTickets = updateFlight(
					{
						flight: tickets[i].flight,
						time: tickets[i].time,
						amount: tickets[i].amount - ticketsToBuyOnCurrentFlight,
						sold: tickets[i].sold + ticketsToBuyOnCurrentFlight,
						registered: tickets[i].registered,
					},
					tickets
				)
			}
		}
	}

	if (ticketsBought.length > 0) {
		logReq('AddTicketSalesEvent')
		await fetch('http://localhost:4007/AddTicketSalesEvent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'tickets_bought',
				ticketsBought,
			}),
		})
	}

	logRes('BuyTickets', { newTickets })
	res.json(newTickets)
})

const updateTime = async () => {
	logReq('Time')
	const response = await (
		await fetch('http://localhost:4003/Time', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ from: MODULE_NAME }),
		})
	).json()
	time = response.time
	multiplicator = response.multiplicator
	logRes('Time', time)
}

const updateFlight = (updatedTicket, tickets) => {
	const newTickets = []
	for (let i = 0; i < tickets.length; i++) {
		if (tickets[i].flight === updatedTicket.flight)
			newTickets.push(updatedTicket)
		else newTickets.push(tickets[i])
	}
	return newTickets
}

if (process.env.NODE_ENV === 'production') {
	app.use(express.static('client/build'))

	app.get('*', (_, res) => {
		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
	})
}

const PORT = process.env.PORT || 4004
app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))
