// Importer les modules nécessaires
const { VoiceChannel } = require('discord.js');
const { setInterval } = require('timers');

module.exports = {
    name: 'ready',
    once: true,

    execute(client) {
        // Définir le nom du salon vocal où surveiller les connexions
        console.log(`Logged in as ${client.user.tag}!`);
        // Récupérer l'ID du salon vocal cible et du category parent
        const targetChannelId ='774576754886705152';
        const targetChannel = client.channels.cache.get(targetChannelId);
        const categoryID = '774576464133357583'; // Remplacez par l'ID de la catégorie parente que vous souhaitez utiliser

        if (!targetChannel) {
            console.error(`Could not find channel with ID ${targetChannelId}`);
            return;
        }

        // Fonction pour créer un nouveau salon vocal pour un utilisateur
        const createUserChannel = async (user) => {
            const newChannelName = user.username;
            const parentChannel = client.channels.cache.get(targetChannelId).parent;
            const newChannel = await parentChannel.clone({
                name: newChannelName,
                type: "GUILD_VOICE",
                parent: categoryID,
                permissionOverwrites: [
                  {
                    id: user.id,
                    allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'MOVE_MEMBERS', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'USE_VAD'],
                  },
                ],
              });
            userChannels[user.id] = newChannel.id;
            await newChannel.members.set(user.id, user);
            return newChannel;
          };


        // Stocker les salons vocaux créés pour chaque utilisateur
        const userChannels = {};

        // Surveiller les connexions des utilisateurs au salon vocal cible
        client.on('voiceStateUpdate', async (oldState, newState) => {
            if (newState.channel && newState.channel.id === targetChannelId) {
                const user = newState.member.user;
                console.log(user.username+' connected to the "join to create" channel');
                if (!userChannels[user.id]) {
                    console.log('Creating '+user.username+' private channel');
                    const userChannel = await createUserChannel(user);
                    await newState.member.voice.setChannel(userChannel);
                    // Supprimer le salon vocal créé si personne n'est dedans au bout de 30
                    const channelTimer = setInterval(() => {
                      if (userChannel.members.size === 0) {
                        userChannel.delete()
                          .then(() => clearInterval(channelTimer))
                          .catch(console.error);
                      }
                    }, 30000);
                  } else {
                    console.log('Adding '+user+' to existing channel');
                    let userChannel = client.channels.cache.get(userChannels[user.id]);
                    if (!userChannel) {
                      console.log(user.username+' channel not found, creating a new one');
                      userChannel = await createUserChannel(user);
                    }
                    await userChannel.members.set(newState.member.id, newState.member);
                    await newState.member.voice.setChannel(userChannel);

                    // Supprimer le salon vocal créé si personne n'est dedans au bout de 30
                    const channelTimer = setInterval(() => {
                        if (userChannel.members.size === 0) {
                          userChannel.delete()
                            .then(() => clearInterval(channelTimer))
                            .catch(console.error);
                        }
                      }, 30000);
                  }
            } else if (oldState.channel && oldState.channel.id === targetChannelId) {
                const user = oldState.member.user;
                console.log(user.username+' left the channel');
                if (userChannels[user.id]) {
                    console.log("deleting "+user.username+" channel");
                    const userChannel = client.channels.cache.get(userChannels[user.id]);
                    userChannel.members.delete(oldState.member.id);
                    if (userChannel.members.size === 0) {
                        userChannel.delete()
                            .then(() => {
                                console.log(user.username+" channel deleted");
                                delete userChannels[user.id];
                            })
                            .catch(console.error);
                    }
                }
            }
        });
    },
};
