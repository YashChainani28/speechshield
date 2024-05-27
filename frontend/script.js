(function () {
     var chat = {
          messageToSend: '',
          init: function () {
               this.cacheDOM();
               this.bindEvents();
               this.render();
          },
          cacheDOM: function () {
               this.$chatHistory = $('.chat-history');
               this.$send = $('#send');
               this.$textarea = $('#message-to-send');
               this.$header = $('.chat-with');
               this.$chatHistoryList = this.$chatHistory.find('ol');
          },
          bindEvents: function () {
               this.$send.on('click', this.addMessage.bind(this));
               this.$textarea.on('keyup', this.addMessageEnter.bind(this));
          },
          render: function () {

               if (sessionStorage.getItem("id") === null) {
                    sessionStorage.setItem("id", Math.floor((100000 + Math.random() * 900000)));
               }

               this.$chatHistoryList.empty();

               fetch('https://get-messages.streamlinechat.workers.dev/', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
               }).then((response) => {
                    // Check if the response is successful (status 200-299)
                    if (!response.ok) {
                         throw new Error('Network response was not ok');
                    }
                    // responses
                    return response.json();
               }).then((jsonData) => {
                    console.log(jsonData.json_messages.messages);

                    for (var i = 0; i < jsonData.json_messages.messages.length; i++) {
                         if (jsonData.json_messages.messages[i].role === sessionStorage.getItem("id")) {
                              var template = Handlebars.compile($("#message-template").html());
                              var context = {
                                   messageOutput: jsonData.json_messages.messages[i].content,
                                   time: this.getCurrentTime(),
                              };

                              this.$chatHistoryList.append(template(context));
                              this.scrollToBottom();
                         } else {
                              var template = Handlebars.compile($("#message-response-template").html());
                              var context = {
                                   response: jsonData.json_messages.messages[i].content,
                                   time: this.getCurrentTime(),
                              };
                              this.$chatHistoryList.append(template(context));
                              this.scrollToBottom();
                         }
                    }
               }).catch((error) => {
                    // Handle any errors that occurred during the fetch
                    console.error('Fetch Error:', error);
               });



               this.scrollToBottom();
               if (this.messageToSend.trim() !== '') {
                    this.$textarea.val('');

                    fetch('https://speechshield.streamlinechat.workers.dev/', {
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json'
                         },
                         body: JSON.stringify({ "messages": [{ "role": "user", "content": this.messageToSend.trim() }], "type": "initial" })
                    }).then((response) => {
                         // Check if the response is successful (status 200-299)
                         if (!response.ok) {
                              throw new Error('Network response was not ok');
                         }
                         // responses
                         return response.text();
                    }).then((textData) => {
                         console.log(textData);
                         if (JSON.parse(textData).message === "yes" || JSON.parse(textData).message === "Yes") {
                              var templateResponse = Handlebars.compile($("#warning-template").html());
                              var contextResponse = {
                                   response: "That message may be offensive. Are you sure you want to send it? Here is an alternative way to phrase that:",
                                   time: this.getCurrentTime(),
                              };

                              this.$chatHistoryList.append(templateResponse(contextResponse));

                              var template = Handlebars.compile($("#message-template").html());
                              var context = {
                                   messageOutput: "Original: " + this.messageToSend.trim(),
                                   time: this.getCurrentTime(),
                              };

                              this.$chatHistoryList.append(template(context));
                              this.scrollToBottom();

                              this.genAlternative(this.messageToSend.trim());
                         } else {
                              fetch('https://push-message.streamlinechat.workers.dev/', {
                                   method: 'POST',
                                   headers: {
                                        'Content-Type': 'application/json'
                                   },
                                   body: JSON.stringify({ "role": sessionStorage.getItem("id"), "content": this.messageToSend.trim() })
                              })

                              var template = Handlebars.compile($("#message-template").html());
                              var context = {
                                   messageOutput: this.messageToSend.trim(),
                                   time: this.getCurrentTime(),
                              };

                              this.$chatHistoryList.append(template(context));
                              this.scrollToBottom();
                         }
                         this.scrollToBottom();
                         // Further processing, parsing, or displaying the text content
                    }).catch((error) => {
                         // Handle any errors that occurred during the fetch
                         console.error('Fetch Error:', error);
                    });



               }
          }, genAlternative: function (message) {
               this.scrollToBottom();

               fetch('https://speechshield.streamlinechat.workers.dev/', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "messages": [{ "role": "user", "content": message }], "type": "alternative" })
               }).then((response) => {
                    // Check if the response is successful (status 200-299)
                    if (!response.ok) {
                         throw new Error('Network response was not ok');
                    }
                    return response.text();
               }).then((textData) => {
                    // responses
                    var templateResponse = Handlebars.compile($("#message-template").html());
                    var contextResponse = {
                         messageOutput: "Alternative: " + JSON.parse(textData).message,
                         time: this.getCurrentTime(),
                    };

                    this.$chatHistoryList.append(templateResponse(contextResponse));

                    var buttonsTemplate = `
                         <li class="buttons">
                              <button id="use-original">Use Original</button>
                              <button id="use-alternative">Use Alternative</button>
                              <button id="cancel-send">Don't Send</button>
                         </li>
                    `;
                    this.$chatHistoryList.append(buttonsTemplate);

                    $('#use-original').on('click', () => {
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 4).remove();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 2).remove();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 1).remove();

                         const msg = this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 1).find('.message').text();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 1).remove();

                         fetch('https://push-message.streamlinechat.workers.dev/', {
                              method: 'POST',
                              headers: {
                                   'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ "role": sessionStorage.getItem("id"), "content": msg.split(": ")[1] })
                         })

                         var template = Handlebars.compile($("#message-template").html());
                         var context = {
                              messageOutput: msg.split(": ")[1],
                              time: this.getCurrentTime(),
                         };

                         this.$chatHistoryList.append(template(context));
                         this.scrollToBottom();

                    });
                    $('#use-alternative').on('click', () => {
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 4).remove();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 3).remove();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 1).remove();

                         const msg = this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 1).find('.message').text();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 1).remove();

                         fetch('https://push-message.streamlinechat.workers.dev/', {
                              method: 'POST',
                              headers: {
                                   'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ "role": sessionStorage.getItem("id"), "content": msg.split(": ")[1] })
                         })

                         var template = Handlebars.compile($("#message-template").html());
                         var context = {
                              messageOutput: msg.split(": ")[1],
                              time: this.getCurrentTime(),
                         };

                         this.$chatHistoryList.append(template(context));
                         this.scrollToBottom();
                    });
                    $('#cancel-send').on('click', () => {
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 4).remove();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 3).remove();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 2).remove();
                         this.$chatHistoryList.find('li').eq(this.$chatHistoryList.find('li').length - 1).remove();
                    });

                    this.scrollToBottom();
                    // Further processing, parsing, or displaying the text content
               }).catch((error) => {
                    // Handle any errors that occurred during the fetch
                    console.error('Fetch Error:', error);
               });
          },
          addMessage: function () {
               this.messageToSend = this.$textarea.val();
               this.render();
          },
          endChat: function () {
               this.messageToSend = "End Chat";
               this.render();
          },
          addMessageEnter: function (event) {
               // enter was pressed
               if (event.keyCode === 13) {
                    this.addMessage();
               }
          },
          scrollToBottom: function () {
               this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
          },
          getCurrentTime: function () {
               return new Date().toLocaleTimeString().
                    replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
          },
          getRandomItem: function (arr) {
               return arr[Math.floor(Math.random() * arr.length)];
          },
     };

     chat.init();
})();
