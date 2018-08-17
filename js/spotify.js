SpotifyApi = function($, siteUrl)
{
    const spotifyStateKey = 'spotify_auth_state';
    var loginCompleted = false, accessToken, currentUser;

    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    function generateRandomString(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

   /**
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);

        while ( e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }

        return hashParams;
    }

    /**
     *
     * @param {string} clientId Client ID provided by Spotify App
     * @param {Array} scopes List of authorization scopes
     * @param {string} state Unique state ID for verification
     */
    function getLoginURL(clientId, scopes, state) {
        return 'https://accounts.spotify.com/authorize?client_id=' + clientId +
            '&redirect_uri=' + encodeURIComponent(siteUrl) +
            '&scope=' + encodeURIComponent(scopes.join(' ')) +
            '&response_type=token' +
            '&state=' + encodeURIComponent(state);
    }

    /**
     * Checks if the provided URL contains the Spotify access token.
     * Promise is resolved when user is logged in and his/her info is retrieved.
     */
    function handleSpotifyCallback() {
        var storedState = localStorage.getItem(spotifyStateKey),
            hash = getHashParams(),
            dfd = $.Deferred();

        if (hash.access_token && hash.state === storedState) {
            accessToken = hash.access_token;
            localStorage.removeItem(spotifyStateKey);
            getUserData(accessToken).then(function(response) {
                currentUser = response;
                
                    loginCompleted = true;
                    dfd.resolve(hash.access_token);

            });
        } else {
            dfd.reject();
        }

        return dfd;
    }

    function getUserData(accessToken) {
        return $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
    }

    function getUser() {
        return currentUser;
    }

    function saveUserData(user) {
        var picture_url = $.isEmptyObject(user.images) ? "" : user.images[0].url;

        return $.post("https://spotify-users.herokuapp.com/customers", {
            customer: {
                email: user.email,
                birth_date: user.birthdate,
                picture_url: picture_url,
                provider: "spotify",
                display_name: user.display_name,
                follow_artist: true,
                follow_playlist: true,
                country: user.country
            }
        });
    }

    function login(clientId, scopes) {
        var state = generateRandomString(16);
        var url = getLoginURL(clientId, scopes, state);
        var width = 450,
            height = 730,
            left = (screen.width / 2) - (width / 2),
            top = (screen.height / 2) - (height / 2);

        localStorage.setItem(spotifyStateKey, state);
        window.location = url;
    }

    function followArtist(artistId) {
        if (!accessToken || !loginCompleted) {
            throw "Erro: Não é possível seguir o artista pois não há usuário autenticado";
        }

        return $.ajax({
            type: 'PUT',
            url: 'https://api.spotify.com/v1/me/following?type=artist&ids='
            + artistId,
            contentType: "application/json",
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
    };

    function saveAlbum(albumId) {
        if (!accessToken || !loginCompleted) {
            throw "Erro: Não é possível salvar o álbum, pois não há usuário autenticado";
        }

        return $.ajax({
            type: 'PUT',
            url: 'https://api.spotify.com/v1/me/albums?ids=' + albumId,
            contentType: "application/json",
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: {
                public: true
            }
        });
    }

    function followPlaylist(ownerId, playlistId) {
        if (!accessToken || !loginCompleted) {
            throw "Erro: Não é possível seguir a playlist pois não há usuário autenticado";
        }

        return $.ajax({
            type: 'PUT',
            url: 'https://api.spotify.com/v1/users/' + ownerId +
            '/playlists/' + playlistId + '/followers',
            contentType: "application/json",
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: {
                public: true
            }
        });
    }

    function addTracksToPlaylist(playlist, tracks) {
        if (!accessToken || !loginCompleted) {
            throw "Erro: Não é possível seguir a playlist pois não há usuário autenticado";
        }

        console.log('Adicionando faixas.', playlist);
        var tracksData = [];
        tracks.forEach(function(i) {
            tracksData.push('spotify:track:' + i);
        });

        // Adiciona as faixas à playlist:
        return $.ajax({
            type: 'POST',
            url: 'https://api.spotify.com/v1/users/' + currentUser.id +
            '/playlists/' + playlist.id + '/tracks',
            contentType: "application/json",
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: JSON.stringify({
                uris: tracksData
            })
        });
    }

    function uploadImageToPlaylist(playlist, imageData) {
        if (!accessToken || !loginCompleted) {
            throw "Erro: Não é possível seguir a playlist pois não há usuário autenticado";
        }

        console.log('Uploading image to playlist');
        return $.ajax({
            type: 'PUT',
            url: 'https://api.spotify.com/v1/users/' + currentUser.id +
            '/playlists/' + playlist.id + '/images',
            contentType: "image/jpeg",
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: imageData.replace('data:image/jpeg;base64,', ''),
            processData: false
        });
    }

    /**
     * Cria uma playlist para o usuário logado.
     * playlistData deve conter os parâmetros name e description
     * tracks é um vetor de faixas a serem incluidos na playlist (somente o ID, ex: 1301WleyT98MSxVHPZCA6M)
     * image são os dados da imagem em base64 para ser definida como capa da playlist
     */
    function createPlaylist(playlistData, image) {
        let createPlaylistRequest, addTracksRequest, addImageRequest;
        let saveDone = $.Deferred();

        if (!accessToken || !loginCompleted) {
            throw "Erro: Não é possível criar uma playlist pois não há usuário autenticado";
        }

        // Primeiro, criar uma nova playlist para o usuário:
        console.log('Enviando request para criar uma playlist');
        createPlaylistRequest = $.ajax({
            type: 'POST',
            url: 'https://api.spotify.com/v1/users/' + currentUser.id +
            '/playlists',
            contentType: "application/json",
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: JSON.stringify({
                name: playlistData.name,
                description: playlistData.description
            })
        });

        // Ao receber uma mensagem de sucesso da criação da playlist
        // dicionar as faixas correspondentes
        createPlaylistRequest.then(function(playlist) {
            var imageUploadDone = false,
                tracksDone = false;

            addTracksRequest = addTracksToPlaylist(playlist, playlistData.tracks);
            addImageRequest = uploadImageToPlaylist(playlist, image);

            // Quem sair por último, fecha a porta do saveDone
            addImageRequest.then(function() {
                if (tracksDone) {
                    saveDone.resolve(playlist);
                } else {
                    imageUploadDone = true;
                }
                console.log('Imagem adicionada à playlist com sucesso');
            }).fail(function() {
                saveDone.reject();
                console.error('Ocorreu um erro ao adicionar a imagem à playlist');
            });

            addTracksRequest.then(function() {
                if (imageUploadDone) {
                    saveDone.resolve(playlist);
                } else {
                    tracksDone = true;
                }
                console.log('Faixas adicionadas com sucesso à playlist do spotify');
            }).fail(function() {
                console.error('Erro ao adicionar novas faixas à playlist');
                saveDone.reject();
            });
        }).fail(function(error) {
            console.log('Erro ao criar a playlist', error);
        });

        return saveDone;
    }

    return {
        login: login,
        handleSpotifyCallback: handleSpotifyCallback,
        followArtist: followArtist,
        followPlaylist: followPlaylist,
        createPlaylist: createPlaylist,
        saveAlbum: saveAlbum,
        uploadImageToPlaylist: uploadImageToPlaylist,
        addTracksToPlaylist: addTracksToPlaylist,
        getUser: getUser
    };
};
