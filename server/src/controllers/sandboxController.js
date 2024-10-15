const axios = require('axios');

const sandboxController = {
unsandboxClient: async (req, res) => {
        console.log(`${req.body}` );
        const { clientId, routerId, sandboxId, sandboxed } = req.body;
        console.log(`unsandbox client ${clientId}` );

        if (!clientId || !routerId) {
            return res.status(400).json({ error: 'clientId, sandboxId, and routerId are required.' });
        }

        let accessToken;

        try {
            console.log(
                {
                    'client_id': process.env.API_CLIENT_ID,
                    'client_secret': process.env.API_SECRET,
                    'grant_type': 'client_credentials'
                },
            );
            const tokenResponse = await axios.post('https://api.starlink.com/auth/connect/token', {
                    'client_id': process.env.API_CLIENT_ID,
                    'client_secret': process.env.API_SECRET,
                    'grant_type': 'client_credentials'
                },
                {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}    
            );

            accessToken = tokenResponse.data.access_token;

            if (!accessToken) {
                return res.status(400).json({ error: 'Access token not found in response.' });
            }

        } catch (error) {
            console.error('Error fetching access token:', error.message, error.response?.data);
            res.status(500).json({ error: 'Failed to unsandbox client.' });
        }

        try {
            let strippedRouterId = routerId.replace('Router-','');
            let expiry = new Date();
            expiry.setHours(expiry.getHours() + 6);
            let payload = 
            {
                routerId: strippedRouterId,
                sandboxId: sandboxId,
                clientId: clientId,
                expiry: expiry.toISOString()
            }
            const jsonPayload = JSON.stringify(payload);
            console.log(jsonPayload);
            
            await axios.post('https://web-api.starlink.com/enterprise/v1/account/' + process.env.API_ACCOUNT + '/routers/sandbox/client', payload,
                {
                    headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                }}    
            ).then(resp => {console.log(resp)});

        } catch (error) {
            console.error('Error unsandboxing client:', error.message, error.response?.data);
            res.status(500).json({ error: 'Failed to unsandbox client.' });
        }

        res.status(200);
    }
};

module.exports = sandboxController;


