this file provides notes on how the ingest script behaves when it runs including issues we need to address and resolve.

- we need to ensure this ingest script contains all the functionality we need without introducing any over engineering or over complication. it needs to be as simple as possible.

- we don't want any parallel work. we don't want concurrent api calls. we want each task to occur sequentially. one after another.

- we need to ensure that api requests are not wasted. we have a quota of 2 api requests per minute and 50 api requests per day. we need to ensure that we never hit the per minute limit so that we can get full usage out of our 50 api requests per day quota.
