$(document).ready(function() {
        // Exemplo de configuração do MJ. (Pode ficar em um arquivo diferente, ou apenas em variáveis)
        var Config = {
            siteUrl: 'https://s3.amazonaws.com/dia-dos-namorados-lucas-lucco/index.html',
            spotify: {
                clientId: '8a0db181059e4ab480d486db68d85578',
                artistId: '06cd30Cv9US973Ika84gDw',
                owner: 'spotify',
                playlistId: '37i9dQZF1DX4sX1GnSxmlr',
                scopes: [
                    "playlist-modify-public",
                    "playlist-modify-private",
                    "user-library-modify",
                    "user-follow-modify",
                    "user-read-private",
                    "user-read-birthdate",
                    "user-read-email",
                    "ugc-image-upload"
                ]
            }
        };

        // Inicializando a classe do Spotify
        var spotify = new SpotifyApi(jQuery, Config.siteUrl);

        // Inicializando a verificação do login.
        // Internamente, essa função verifica as URL do site. Caso o hash passado seja válido, o promise
        // é satisfeito (ou a função atribuída a done(), logo abaixo, é chamada).
        var loginCallback = spotify.handleSpotifyCallback();


        // Tudo que será feito no momento do login ter sido realizado com sucesso
        loginCallback.done(function() {
            spotify.followArtist(Config.spotify.artistId);
            spotify.followPlaylist(Config.spotify.owner,Config.spotify.playlistId);
            ga('send', 'event', 'click','click', 'dia-dos-namorados-lucas-lucco');
            $('#step-1').hide();
            $('#step-2').fadeIn(500);
            $('#spinner').fadeIn(500);
            setTimeout(function(){ $('#spinner').hide(); $('#step-2').hide(); $('#step-3').fadeIn(500); }, 30000);
            // Etc.
            // Ex: Mostra a segunda parte da página
        });

        // Tudo que será feito se o usuário não se encontra logado / ou rejeitou as autorizações
        loginCallback.fail(function() {
            // (...)
            // Ex (opcional, pode estar fora do fail()):
            // Aqui eu posso apenas definir o evento do click do botão apenas quando o usuário não está logado
            $('#spotify-login').on('click', function() {
                spotify.login(Config.spotify.clientId, Config.spotify.scopes).then(function() {
            });
        });

        loginCallback.always(function() {
            // Tudo que será realizado independente se o usuário estiver logado ou não,
            // mas SEMPRE APÓS a conclusão da verificação
            // Ex: $('#div-principal').show() // fazer um fadeIn com os conteúdos do site
        });
    });
});