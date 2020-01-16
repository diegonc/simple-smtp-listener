"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var EventEmitter = require("events").EventEmitter;

var SMTPServer = require("smtp-server").SMTPServer; // @ts-ignore


var parseMail = require("mailparser").simpleParser;

var ipc = require("node-ipc");
/**
 * Acts as a basic listener SMTP server, listening for all emails.
 * Emits events when a mail is received.
 * Events:
 *   ready => ()
 *   mail => (mail)
 *   err => (Error)
 * Example:
 *   let Mail = new SMTP();
 *   Mail.on("test@example.com", mail=>{ ... });
 *   Mail.on("*", mail=>{ ... });
 */


module.exports =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(SMTP, _EventEmitter);

  /**
   * @param {Number} port             The port to listen on
   * @param {Object} [opts]           Options for the server
   * @param {Boolean} [opts.debug]    Whether to log debug information
   * @param {String} [opts.socketID]  The socket to emit to
   */
  function SMTP() {
    var _this;

    var port = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2525;
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, SMTP);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SMTP).call(this));
    _this.opts = opts;

    _this.debug("Starting on :".concat(port));

    _this.server = new SMTPServer({
      authOptional: true,
      onData: _this.handleData.bind(_assertThisInitialized(_this))
    });

    _this.server.listen(port);

    _this.server.on("error", _this.handleErr.bind(_assertThisInitialized(_this)));

    ipc.config.id = opts.socketID || "simple-smtp-listener";
    ipc.serve(function () {
      _this.debug("Ready");

      _get(_getPrototypeOf(SMTP.prototype), "emit", _assertThisInitialized(_this)).call(_assertThisInitialized(_this), "ready");

      _this.ipc = ipc.server;
    });
    ipc.server.start();
    return _this;
  }

  _createClass(SMTP, [{
    key: "destroy",
    value: function destroy(cb) {
      this.debug("Destroying");
      this.emit("destroyed");
      this.server.close(cb);
    }
  }, {
    key: "handleErr",
    value: function handleErr(err) {
      this.debug("Error: ".concat(err));

      _get(_getPrototypeOf(SMTP.prototype), "emit", this).call(this, "err", err);
    }
    /**
     * @param {String} key  Key to emit
     * @param {...any} [data]    Data to emit
     * @return {Boolean}
     */

  }, {
    key: "emit",
    value: function emit(key, data) {
      _get(_getPrototypeOf(SMTP.prototype), "emit", this).apply(this, arguments); // @ts-ignore


      this.ipc.broadcast(key, data);
    }
  }, {
    key: "handleData",
    value: function handleData(stream, session, cb) {
      parseMail(stream, this.handleEmail.bind(this));
      cb();
    }
  }, {
    key: "handleEmail",
    value: function handleEmail(err, email) {
      if (err) {
        this.emit("err", err);
        this.debug("Got malformed email: ".concat(err));
        return;
      }

      this.debug("Got email to:", JSON.stringify(email.to.value));
      this.emit("email", email);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = email.to.value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var receipient = _step.value;
          this.debug("Emitting", receipient);

          _get(_getPrototypeOf(SMTP.prototype), "emit", this).call(this, receipient.address, email);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
    /**
     * Logs if debug is enabled
     * @param {...any} data
     */

  }, {
    key: "debug",
    value: function debug(data) {
      if (this.opts.debug) {
        console.log.apply(console, ["[SMTP/server]"].concat(Array.prototype.slice.call(arguments)));
      }
    }
  }]);

  return SMTP;
}(EventEmitter);