module.exports = {
    ci: {
        collect: {
            startServerReadyPattern: 'ready',
            url: [''],
        },
        upload: {
            target: 'lhci',
            serverBaseUrl: '<URL>',
            token: '<TOKEN>',
            ignoreDuplicateBuildFailure: true
        },
        assert: {
            preset: 'lighthouse:recommended',
        },
    },
};