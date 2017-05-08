# simple-smtp

A NodeJS script that acts as a simple SMTP listen server. Accepts all emails, and emits them both as an EventEmitter and optionally through RabbitMQ.

## Usage (single access)

If only 1 script needs to receive mails:

```javascript
let SMTPServer = require("simple-smtp").Server;
let server = new SMTPServer(25 /* port */);
server.on("test@example.com", (mail)=>{
    ...
});
```

## Usage (multi access)

If multiple scripts need to receive mails, create a symlink at `/var/dev/simple-smtp/` pointing to the working directory, then create a symlink at `/etc/systemd/system/simple-smtp.service` pointing to `./smtp.service`. Finally run `sudo systemctl start simple-smtp`. This starts the server and keeps it running should it crash.

If you aren't running systemd, do the equivalent on your system.

Then in your scripts do

```javascript
let SMTPClient = require("simple-smtp");
let client = new SMTPClient();
client.on("test@example.com", ()=>{
    ...
});
```

## Mail object

All listeners receive a single response, a `Mail` object. This is simply the email parsed by [Nodemailer's Mailparser](https://nodemailer.com/extras/mailparser/). See their documentation for details.

## RabbitMQ

If you need access to mails from non-JS code (or you don't want to use `SMTPClient`), you can instead listen to the [RabbitMQ](http://www.rabbitmq.com/) exchange.

To run the server in RabbitMQ mode, do (these are also the values used if running the service):

```javascript
let SMTPServer = require("simple-smtp").Server;
let server = new SMTPServer(25, { /* amqp settings */
    host: "localhost",
    exchange: "emails",
    ... /* any extra parameters are passed straight to node-amqp */
});
```

Then create queues and bind them to the exchange in whatever language you are using.