from aiohttp import web
import pymorphy2


morph = pymorphy2.MorphAnalyzer()
cache = {}

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


def main():
    app = web.Application()
    app.add_routes([
        web.post('/normalize', normalize_handle)
    ])
    web.run_app(app)


if __name__ == '__main__':
    main()
