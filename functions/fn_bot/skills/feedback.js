const api = require('../api');
const { scriptForLanguage } = require('../util');

const DEFAULT_EVENT = 'message_received,facebook_postback';

module.exports = (controller, scripts) => {
  controller.hears('test', 'message_received', function(bot, message) {
    var attachment = {
        'type':'template',
        'payload':{
            'template_type':'generic',
            'elements':[
                {
                    'title':'Chocolate Cookie',
                    'image_url':'http://cookies.com/cookie.png',
                    'subtitle':'A delicious chocolate cookie',
                    'buttons':[
                        {
                        'type':'postback',
                        'title':'Eat Cookie',
                        'payload':'chocolate'
                        }
                    ]
                },
            ]
        }
    };

    bot.reply(message, {
        attachment: attachment,
    });
  });

  controller.on('facebook_postback', function(bot, message) {
    console.log("facebook_postback received");
    if (message.payload == 'chocolate') {
      bot.reply(message, 'You ate the chocolate cookie!')
    }
  });

  controller.hears(scripts.eng.feedback.trigger, DEFAULT_EVENT, (bot, message) => {
    const script = scriptForLanguage(scripts, message.user_profile.language);

    bot.startConversation(message, (err, convo) => {
      let score = null;
      let improved = null;
      let features = null;

      const q1_replies = script.feedback.question_1.options.map(option => {
        return {
          content_type: 'text',
          title: option.text,
          payload: option.payload
        };
      });

      convo.addQuestion({text:script.feedback.question_1.text, quick_replies: q1_replies}, (response, convo) => {
        if (response.text) {
          score = response.text;
          convo.next();
        }
      });

      convo.addQuestion({text:script.feedback.question_2}, (response, convo) => {
        if (response.text) {
          improved = response.text;
          convo.next();
        }
      });
      convo.addQuestion({text:script.feedback.question_3}, (response, convo) => {
        if (response.text) {
          features = response.text;

          api.leaveFeedback({
            firstName: 'firstName',
            lastName: 'lastName',
            userId: 'userId',
            language: 'language',
            score: score,
            improved: improved,
            features: features,
          });

          convo.next();
        }
      });


      convo.say(script.feedback.reply);

      //Maybe this could be a convo.end
      convo.ask({text: script.feedback.menu_button.text, quick_replies: [
          {
            content_type: "text",
            title: script.feedback.menu_button.quick_reply_title,
            payload: script.feedback.menu_button.redirect_to
          }
        ]
      });
      convo.activate();
    });
  });
}
