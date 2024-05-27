export default {
     async fetch(request, env, ctx) {
          if (request.headers.get('Content-Type') !== 'application/json') {
               return new Response("", {
                    headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': 'https://speech-shield.pages.dev', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST', },
                    status: 200
               });
          }

          const cur_messages = await request.json();
          const api_key = await env.apis.get(1);
          var chat_response = {};

          if ((cur_messages.type) === "initial") {
               const system_prompt = "You are a content review bot that analyzes messages to see if the message contains any divisive, discriminatory, insensitive, or bullying content. If it contains any of this negative content, reply with one word: yes. If it does not contain any of this negative content, reply with one word: no. Your response should always only be one word, either yes or no.";
               const orig_messages = {
                    model: "gpt-3.5-turbo",
                    messages: [{ "role": "system", "content": system_prompt }, ...(cur_messages.messages)],
                    temperature: 0.6,
               };

               const openai_chat_response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                         'Authorization': api_key,
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orig_messages)
               });

               chat_response = await openai_chat_response.json();
          } else {
               const system_prompt = "The message the user sent was found to contain divisive, discriminatory, insensitive, or bullying content. Please rewrite it in a way that makes it kinder, less insulting, or less offensive. Your response should just be the rewritten message. You are not responding to the message; you are rewriting it.";
               const orig_messages = {
                    model: "gpt-3.5-turbo",
                    messages: [{ "role": "system", "content": system_prompt }, ...(cur_messages.messages)],
                    temperature: 0.6,
               };

               const openai_chat_response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                         'Authorization': api_key,
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orig_messages)
               });

               chat_response = await openai_chat_response.json();
          }
          // Return the response
          return new Response(JSON.stringify({ "message": chat_response.choices[0].message.content, }), {
               headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://speech-shield.pages.dev', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST', },
               status: 200
          });
     }
}