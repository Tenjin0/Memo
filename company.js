define(['pnotify', 'require', 'bootstrap_datetimepicker', 'bootstrap_slider', 'bootstrap_toggle'],
function (Pnotify) {
    if (debug) {
        console.log('company.js loaded');
    }

    var contractDiv = $('#contract');
    var formCompany = $('#form_company');
    var formCompanyId = $('#form_company').find('#id');
    var formContract = $('#form_company_contract');
    var formContractPaymentMethod = formContract.find('#payment_method');
    var formContractDirectDebitDelayDiv = formContract.find('#direct_debit_delay').parents('.form-group');
    var extranetId = '1';
    var formCompanyIdParentCompany = $('#id_parent_company');
    var formCompanyIdArmField = $(formCompany.find('#id_arm')[0]);
    var formCompanyIdParentCompany = $('#id_parent_company');
    var formContractIdUserCommercial = $('#id_user_commercial');
    var formContractId = formContract.find('#id');
    var htmlBody = $('html, body');
    var body = $('body');
    var isUpdatePage = formCompanyId.val() > 0;

    var formCompanyAddressLine1 = formCompany.find('#address_line_1');
    var formCompanyAddressLine2 = formCompany.find('#address_line_2');
    var formCompanyZipCode = formCompany.find('#zip_code');
    var formCompanyCity = formCompany.find('#city');
    var formCompanyCountry = formCompany.find('#country');
    var formCompanyCorporateName = formCompany.find('#corporate_name');

    var tmpLocale = body.data('current-locale');

    $('#contract_start_date').datetimepicker({
        format: 'YYYY-MM-DD',
        locale: user_session.locale
    });

    $('[data-is-slider=1]').each(function (e, element) {
        element = $(element);
        var tooltip = element.data('tooltip');

        element.slider({
            tooltip: 'always',
            formatter: function(value) {
                element.val(value);
                return value + tooltip;
            }
        });
    });

    formCompanyIdParentCompany.on('change ready', function (event) {
        if (extranetId === formCompanyIdParentCompany.val()) {
            contractDiv.fadeIn();
        } else {
            contractDiv.fadeOut();
        }
    }).triggerHandler('change');

    formCompany.on('submit', function (event) {
        event.preventDefault();

        var url = formCompany.attr('action');
        var method = formCompany.attr('method');
        var data = formCompany.serializeArray();

        $.ajax({
            url: url,
            method: method,
            data: data,
            error: window.apiOut
        }).done(function (data) {
            data = JSON.parse(data);

            new Pnotify({
                type: 'success',
                icon: 'fa fa-check',
                text: text_for['company_' + (formCompany.data('is-update') ? 'update' : 'save') + '_success'],
                stack_context: {context: formCompany}
            });

            var panelShowed = checkAndShowUserPanel();

            if (formCompanyIdParentCompany.val() === extranetId && formContractId.val() == 0) {
                htmlBody.animate({scrollTop: $('#contract').offset().top}, 300);
            } else if (true || '0' == formCompany.data('is-update') && panelShowed && !isUpdatePage) {
                $('[data-target="#collapseUser"]').triggerHandler('click');
            }

            if (undefined !== data.id) {
                if ('0' == formCompany.data('is-update') && undefined !== data.id && '' !== data.id) {
                    formCompany.find('input[name="id"]').val(data.id);
                    formCompany.find('input[name="creation_datetime"]').val(data.creation_datetime);

                    $('.ajax_form').each(function (index, element) {
                       $(element).find('#id_company').val(data.id);
                    });

                    $('#form_company_user').find('#id_company').val(data.id);
                    $('#form_company_invoice_account').find('#id_company').val(data.id);
                }

                formCompany.attr('action', formCompany.data('url-for-update') + data.id);
                formCompany.data('is-update', 1);
            }

            if ('' === $('#account_name').val()) {
                $('#account_name').val($('#corporate_name').val());
                $('#invoice_corporate_name').val($('#corporate_name').val());
            }

            checkAndShowUserPanel();
        });

        return false;
    });

    formContractPaymentMethod.on('change', function () {
        if (formContractPaymentMethod.val() === 'DIRECT_DEBIT') {
            formContractDirectDebitDelayDiv.fadeIn('fast');
        } else {
            formContractDirectDebitDelayDiv.fadeOut('fast');
        }
    }).triggerHandler('change');

    if (document.querySelector('#item-main_production_parameters a')) {
        document.querySelector('#item-main_production_parameters a').addEventListener('click', function () {
            require(['elessar', 'company_range_bar']);
        });
    }

    formContract.on('submit', function (event) {
        event.preventDefault();

        var url = formContract.attr('action');
        var method = formContract.attr('method');
        var data = formContract.serializeArray();

        $.ajax({
            url: url,
            method: method,
            data: data,
            error: window.apiOut
        }).done(function (data) {
            data = JSON.parse(data);
            var update = formContract.data('is-update');

            new Pnotify({
                type: 'success',
                icon: 'fa fa-check',
                text: text_for[update == '0' ? 'contract_save_success' : 'contract_update_success']
            });

            if (formContractId.val() === '' && undefined !== data.id) {
                formContractId.val(data.id);
                formContract.attr('action', formContract.data('url-for-update') + data.id);
                formContract.data('is-update', 1);
            }

            var panelShowed = checkAndShowUserPanel();

            if ('0' == update && panelShowed) {
                $('[data-target="#collapseUser"]').triggerHandler('click');
            }
        });

        return false;
    });

    var checkAndShowUserPanel = function ()
    {
        var idParentCompany = formCompanyIdParentCompany.val() || formCompanyIdParentCompany.data('value');

        if (
            formCompanyId.val() > 0 && (
                formCompanyId.val() == extranetId ||
                idParentCompany != extranetId ||
                formContractId.val() > 0
            )
        ) {
            require(['company_user']);
            return true;
        } else {
            return false;
        }
    };

    checkAndShowUserPanel();

    $('body .company-menu a').on('click', function (event) {
        event.preventDefault();

        var target = event.currentTarget;
        var dataTarget = $(target).data('target');

        $('.company-menu').removeClass('active');
        $(event.currentTarget).parent().addClass('active');

        $('.company_page_collapse').fadeOut('fast');

        if ('#collapseCompany' === dataTarget) {
            $('#company_div').fadeIn('fast');
        } else if ('#collapseUser' === dataTarget) {
            $('#user_div').fadeIn('fast');
        } else if ('#collapseMainProductionParameters' === dataTarget) {
            $('#main_production_account_div').fadeIn('fast');
        } else if ('#collapseInvoiceAccount' === dataTarget) {
            $('#invoice_account_div').fadeIn('fast');
        } else if ('#collapseProductionAccount' === dataTarget) {
            $('#production_account_div').fadeIn('fast');
        } else if ('#collapsePricingSubscription' === dataTarget) {
            $('#pricing_subscription_div').fadeIn('fast');
        } else if ('#collapseInvoice' === dataTarget) {
            $('#invoice_div').fadeIn('fast');
        }
    });

    body.on('load_production_account load_pricing', function (event, element) {
        element.find('input[class="checkbox-toggle"]').each(function () {
            var thisElement = $(this);
            thisElement.bootstrapToggle();

            if (thisElement.data('toggleid')) {
                var toggleId = thisElement.data('toggleid');
                thisElement.change(function () {
                    $('#' + toggleId).collapse('toggle');
                });
            } else {
                var toggleClass = thisElement.data('toggleclass');
                thisElement.change(function () {
                    $('.' + toggleClass).collapse('toggle');
                });
            }
        });
    });

    body.triggerHandler('load_production_account', [body]);

    var defaultAjaxSubmitFunction = function (form, formId, callback)
    {
        if (!formId) {
            formId = form.find('#id');
        }

        form.on('submit', function (event) {
            event.preventDefault();

            var url = form.attr('action');
            var method = form.attr('method');
            var data = form.serializeArray();

            $.ajax({
                url: url,
                method: method,
                data: data,
                error: window.apiOut
            }).done(function (data) {
                data = JSON.parse(data);
                var isUpdate = true;

                if (formId.val() === '' && undefined !== data.id) {
                    isUpdate = false;
                    formId.val(data.id);
                    form.attr('action', form.data('url-for-update') + data.id);
                    form.data('is-update', 1);
                }

                callback(data, isUpdate);
            });

            return false;
        });
    };

    var loadList = function (opts, callback)
    {
        $.ajax({
            url: opts.url,
            method: 'POST',
            data: {
                pagination: 1,
                id_company: formCompanyId.val(),
                for_company: true
            },
            error: window.apiOut
        }).done(function (data) {
            opts.divContent.html(data);

            opts.divContent.find('.company-ajax-link').on('click', function (event) {
                event.preventDefault();
                opts.loadItem(event);
            });

            callback();
        });
    };

    var loadItem = function (opts, callback)
    {
        var target = $(opts.event.currentTarget);

        $.ajax({
            url: target.attr('href'),
            method: 'POST',
            data: {
                pagination: 1,
                for_company: true
            },
            error: window.apiOut
        }).done(function (data) {
            opts.divContent.html(data);

            opts.divContent.find('form').on('submit', function (event) {
                event.preventDefault();
                opts.submitForm(event);
            });

            callback();
        });

        return false;
    };

    var loadEmptyForm = function (opts, callback)
    {
        $.ajax({
            url: opts.url,
            method: 'POST',
            data: {
                pagination: 1,
                for_company: true,
                id_company: formCompanyId.val()
            },
            error: window.apiOut
        }).done(function (data) {
            opts.divContent.html(data);

            opts.divContent.find('form').on('submit', function (event) {
                event.preventDefault();
                opts.submitForm(event);
            });

            callback();
        });

        return false;
    };

    var submitForm = function (opts, callback)
    {
        var form = $(opts.event.currentTarget);
        var url = form.attr('action');
        var method = form.attr('method');
        var data = form.serializeArray();
        var tmpData = {};

        data.forEach(function (element) {
            if (!tmpData[element.name]) {
                tmpData[element.name] = element;
            } else {
                if (!Array.isArray(tmpData[element.name].value)) {
                    tmpData[element.name].value = [tmpData[element.name].value];
                }

                tmpData[element.name].value.push(element.value);
            }
        });

        data = Object.keys(tmpData).map(function (index) {
            return tmpData[index];
        });

        $.ajax({
            url: url,
            method: method,
            data: data,
            error: window.apiOut
        }).done(function (data) {
            data = JSON.parse(data);
            var match = url.match(/.*\/([a-zA-Z_]+)\/(update|save)/);
            var msg = match[1] + '_' + match[2] + '_success';

            new Pnotify({
                type: 'success',
                icon: 'fa fa-check',
                text: text_for[msg]
            });

            opts.loadEmptyForm();
            opts.loadList();

            callback(data);
        });

        return false;
    };

    body.on('click', '.company-toggle-btn', function (event) {
        $($(event.currentTarget).data('target')).fadeToggle();
    });

    body.on('click', '.ajax-link-return', function (event) {
        event.preventDefault();
        body.triggerHandler('loadList-' + $(event.currentTarget).data('target'));
    });

    return {
        body: body,
        contractDiv: contractDiv,
        formCompany: formCompany,
        formCompanyId: formCompanyId,
        formContractId: formContractId,
        extranetId: extranetId,
        formCompanyIdParentCompany: formCompanyIdParentCompany,
        formCompanyIdArmField: formCompanyIdArmField,
        formContractIdUserCommercial: formContractIdUserCommercial,
        defaultAjaxSubmitFunction: defaultAjaxSubmitFunction,
        loadList: loadList,
        loadItem: loadItem,
        loadEmptyForm: loadEmptyForm,
        submitForm: submitForm,
        isUpdatePage: isUpdatePage,
        formCompanyAddressLine1: formCompanyAddressLine1,
        formCompanyAddressLine2: formCompanyAddressLine2,
        formCompanyZipCode: formCompanyZipCode,
        formCompanyCity: formCompanyCity,
        formCompanyCountry: formCompanyCountry,
        formCompanyCorporateName: formCompanyCorporateName,
        previousPage: null,
        tmpLocale: tmpLocale
    };
});
