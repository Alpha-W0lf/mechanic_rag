this file provides notes on how the ingest script behaves when it runs including issues we need to address and resolve.

- we need to ensure this ingest script contains all the functionality we need without introducing any over engineering or over complication. it needs to be as simple as possible.

- we don't want any parallel work. we don't want concurrent api calls. we want each task to occur sequentially. one after another.

- we need to ensure that api requests are not wasted. we have a quota of 2 api requests per minute and 50 api requests per day. we need to ensure that we never hit the per minute limit so that we can get full usage out of our 50 api requests per day quota.

- we need to ensure that when an api request is sent, the script waits long enough before it determines whether there was an empty response or not. we seem to be having issues with the script not waiting long enough and sending the next request without properly waiting for a response. it does take some time. up to a minute or more to get the full response from the api. terminal logs show timestamps.

- we should consider modifying the script so that it sends an api request and then waits until a full response with 10 markdown files before it does anything else. perhaps this can be on a generous timeout to ensure it doesnt quit early before the api sends a full response. perhaps 2 or 3 minutes. we really need to ensure enough the script leaves enough time for responses, doesnt send multiple requests at the same time, and doesnt waste any requests.