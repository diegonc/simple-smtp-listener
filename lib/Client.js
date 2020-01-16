"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var ipc = require("node-ipc");

var EventEmitter = require("events").EventEmitter;

var Server = require("./Server.js");
/**
 * Listens to events emitted by Server.js over its socket
 * Emits events when a mail is received.
 * Events:
 *   ready => ()
 *   kill => ()
 *   mail => (mail)
 *   err => (Error)
 * Example:
 *   let Mail = new SMTP();
 *   Mail.on("test@example.com", mail=>{ ... });
 *   Mail.on("*", mail=>{ ... });
 */


var SMTPClient =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(SMTPClient, _EventEmitter);

  /**
   * @param {Object} [opts]           Options for the client
   * @param {Boolean} [opts.debug]    Whether to log debug info
   * @param {String} [opts.socketID]  The socket to connect to
   */
  function SMTPClient() {
    var _this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, SMTPClient);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SMTPClient).call(this));
    _this.opts = opts;
    opts.socketID = opts.socketID || "simple-smtp-listener";
    _this.ready = new Promise(function (res) {
      ipc.config.silent = !opts.debug;
      ipc.connectTo(opts.socketID, function () {
        _this.ipc = ipc.of[opts.socketID];

        _this.ipc.on("connect", function () {
          _this.debug("Connected");

          _this.emit("ready"); // bypass wildcard emit

        });

        _this.ipc.on("disconnect", function () {
          _this.debug("Disconnected");

          _this.emit("kill"); // bypass wildcard emit

        });

        _this.ipc.on("destroyed", function () {
          _this.debug("Server destroyed");

          _this.emit("kill");
        });

        _this.ipc.on("email", _this.handleEmail.bind(_assertThisInitialized(_this)));

        res();
      });
    });
    return _this;
  }
  /**
   * Handles emails received from the server
   */


  _createClass(SMTPClient, [{
    key: "handleEmail",
    value: function handleEmail(mail) {
      this.debug("Received email:", mail);
      this.emit("*", mail);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = mail.to.value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var receipient = _step.value;
          this.debug("Emitting", receipient);
          this.emit(receipient.address, mail);
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
     * Logs to console if debug is enabled
     * @param {...any} [data] The data to emit
     */

  }, {
    key: "debug",
    value: function debug(data) {
      if (this.opts.debug) {
        console.log.apply(console, ["[SMTP/client]"].concat(Array.prototype.slice.call(arguments)));
      }
    }
  }]);

  return SMTPClient;
}(EventEmitter);

SMTPClient.Server = Server;
module.exports = SMTPClient;