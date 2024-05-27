export default {
     async fetch(request, env, ctx) {
          if (request.method === 'OPTIONS') {
               return new Response(null, {
                    headers: {
                         'Access-Control-Allow-Origin': 'https://speech-shield.pages.dev',
                         'Access-Control-Allow-Headers': 'Content-Type',
                         'Access-Control-Allow-Methods': 'POST',
                    },
                    status: 204
               });
          }

          const requestBody = await request.json();
          console.log(requestBody);
          const messages = await env.conversation.get(1);
          const json_messages = await JSON.parse(messages);
          json_messages.messages.push(requestBody);
          console.log(json_messages);
          await env.conversation.put(1, JSON.stringify(json_messages));

          return new Response(JSON.stringify({ json_messages }), {
               headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://speech-shield.pages.dev', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST', },
               status: 200
          });
     }
}