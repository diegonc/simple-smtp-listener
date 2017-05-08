let EventEmitter = require("events").EventEmitter;
let SMTPServer = require("smtp-server").SMTPServer;
let parseMail = require("mailparser").simpleParser;
let amqp = require("amqp");

/**
 * Acts as a basic listener SMTP server, listening for all emails.
 * Emits events when a mail is received.
 * Can also publish events to RabbitMQ. This lets multiple applications listen in.
 * RabbitMQ messages are published to queues with the same name as the received email
 * Events:
 *   email@domain => (mail)
 *   err => (Error)
 * Example:
 *   let Mail = new SMTP();
 *   Mail.on("test@example.com", mail=>{ ... });
 */
module.exports = class SMTP extends EventEmitter {
    /**
     * 
     * @param {Number} port The port to listen on
     * @param {Object} amqp An optional object detailing RabbitMQ related options
     *                      {
     *                          host: "<url>",
     *                          exchange: "<name>",
     *                          ... // additional options for amqp.createConnection
     *                      }
     */
    constructor(port=2525, amqp) {
        console.log(`[SMTP] Starting on :${port}`);
        super();
        this.server = new SMTPServer({
            authOptional: true,
            onData: this.handleData.bind(this)
        });
        this.server.listen(port);
        this.server.on("error", this.handleErr);

        if (amqp) {
            this.setupAMQP(amqp);
        }
    }
    destroy(cb) {
        console.log(`[SMTP] Destroying`);
        this.server.close(cb);
    }
    handleErr(err) {
        this.emit(err);
        console.log(`[SMTP] Error: ${err}`);
    }

    setupAMQP(options) {
        let exchange = options.exchange;
        delete options.exchange;
        this.amqp = amqp.createConnection(options);
        
        this.amqp.on("error", this.handleErr.bind(this));
        this.amqp.on("ready", ()=>{
            this.exchange = this.amqp.exchange(
                exchange,
                {
                    type: "direct",
                    autoDelete: false
                });
        });
    }

    /**
     * @param {String} key  Key to emit
     * @param {any} data    Data to emit
     * @return {Boolean}
     */
    emit(key, data=undefined) {
        super.emit(key,data);

        // publish to amqp if we should
        if (this.exchange) {
            this.exchange.publish(key,data);
        }
    }

    handleData(stream, session, cb) {
        parseMail(stream, this.handleEmail.bind(this));
        cb();
    }
    handleEmail(err, email) {
        if (err) {
            this.emit("err",err);
            console.log(`[SMTP] Got malformed email: ${err}`);
            return;
        }

        console.log(`[SMTP] Got email to:`,JSON.stringify(email.to.value));
        for (let target of email.to.value) {
            this.emit(target.address, email);
        }
    }
};