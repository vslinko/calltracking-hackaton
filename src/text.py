from aiohttp import web
import pymorphy2
from ru_soundex.soundex import RussianSoundex
from ru_soundex.distance import SoundexDistance


morph = pymorphy2.MorphAnalyzer()
cache = {}

soundex = RussianSoundex()
soundex_distance = SoundexDistance(soundex)


async def normalize_handle(request):
    post = await request.json()
    words = post.get('words', [])

    result = []
    for word in words:
        if word not in cache:
            parsed_word = morph.parse(word)
            best_match = parsed_word[0]
            cache[word] = {
                'word': word,
                'normalForm': best_match.normal_form
            }

        result.append(cache[word])

    return web.json_response({
        'result': result
    })


async def soundex_distance_handle(request):
    post = await request.json()
    needles = post.get('needles', [])
    haystack = post.get('haystack', [])

    result = []
    for needle in needles:
        matches = [(word, soundex_distance.distance(needle, word)) for word in haystack]

        result.append({
            'word': needles,
            'matches': matches
        })

    return web.json_response({
        'result': result
    })


def main():
    app = web.Application()
    app.add_routes([
        web.post('/normalize', normalize_handle),
        web.post('/soundex-distance', soundex_distance_handle)
    ])
    web.run_app(app)


if __name__ == '__main__':
    main()
