define(['bootstrap_datetimepicker', 'numeral'], function (datetimepicker, numeral) {
    if (debug) {
        console.log('invoice.js loaded');
    }

    var colorMapping = {
        INVOICE_CREATED: 'info',
        INVOICE_PAYED: 'success',
        INVOICE_PARTIAL_PAYED: 'warning',
        INVOICE_LOSS: 'danger',
        INVOICE_CANCELED: 'default'
    };

    var addPostData = $('#postdata').data('add-post-data');
    var postData = {};

    if (undefined !== addPostData) {
        postData.criteria = {};

        for (var data in addPostData) {
            if (data !== 'for_company') {
                postData.criteria[data] = addPostData[data];
            }
        }
    }

    var add = function (element)
    {
        var companyList = {};
        var formInvoice = element.find('#form_invoice');
        var formInvoiceIdCompany = formInvoice.find('#id_company');
        var formInvoiceInvoiceAccountList = formInvoice.find('#invoice_account_list');
        var formInvoiceInvoiceAccountListRaw = formInvoice.find('#invoice_account_list_raw');

        $.ajax({
            url: url_for.invoice_new_api || url_for.invoice_new,
            method: 'GET',
            data: postData,
            error: function (data) {
                console.error(data);
            },
            accept: 'application/json',
            dataType: 'json'
        }).done(function (data) {
            for (var index in data['invoice_account']['list']) {
                if (!companyList[data['invoice_account']['list'][index]['id_company']]) {
                    companyList[data['invoice_account']['list'][index]['id_company']] = {invoiceAccountList: {}};
                    formInvoiceIdCompany.append('<option value="' + data['invoice_account']['list'][index]['id_company'] + '">' + data['invoice_account']['list'][index]['corporate_name'] + '</option>');
                }

                companyList[data['invoice_account']['list'][index]['id_company']].invoiceAccountList[data['invoice_account']['list'][index]['id']] = data['invoice_account']['list'][index];
            }

            if (formInvoiceIdCompany.data('value') > 0) {
                formInvoiceIdCompany.val(formInvoiceIdCompany.data('value'));
                formInvoiceIdCompany.triggerHandler('change');
            }
        });

        formInvoiceIdCompany.on('change', function () {
            formInvoiceInvoiceAccountList.find('option').remove().end();
            formInvoiceInvoiceAccountList.append('<option value=""></option>');
            formInvoiceInvoiceAccountListRaw.val('');

            if (formInvoiceIdCompany.val() > 0) {
                for(var index in companyList[formInvoiceIdCompany.val()].invoiceAccountList) {
                    formInvoiceInvoiceAccountList.append('<option value="' + index + '">' + companyList[formInvoiceIdCompany.val()].invoiceAccountList[index]['account_name'] + '</option>');
                }

                var tmpKeys = Object.keys(companyList[formInvoiceIdCompany.val()].invoiceAccountList);

                if (tmpKeys.length === 1) {
                    formInvoiceInvoiceAccountList.val(tmpKeys[0]);
                    formInvoiceInvoiceAccountList.triggerHandler('change');
                }
            }
        });

        formInvoiceInvoiceAccountList.on('change', function () {
            formInvoiceInvoiceAccountListRaw.val(JSON.stringify(companyList[formInvoiceIdCompany.val()].invoiceAccountList[formInvoiceInvoiceAccountList.val()]));
        });

        loadDate(element);
    };

    var loadDate = function (element)
    {
        element.find('[data-input-type="date"]').each(function (index, item) {
            $(item).datetimepicker({
                format: 'YYYY-MM-DD',
                locale: user_session.locale
            });

        });
    };

    $("#start_date").on("dp.change", function (e) {
        $('#end_date').data("DateTimePicker").minDate(e.date);
    });

    var update = function (element)
    {
        var formInvoice = element.find('#form_invoice');
        var formInvoiceInvoiceStatus = formInvoice.find('#invoice_status');
        var formInvoiceIdInvoiceAccount = formInvoice.find('#id_invoice_account');
        var newData = {};

        formInvoiceInvoiceStatus.on('change', function () {
            formInvoiceInvoiceStatus.removeClass();
            formInvoiceInvoiceStatus.addClass('form-inline btn btn-' + colorMapping[formInvoiceInvoiceStatus.val()]);
        }).triggerHandler('change');

        element.find('#btn_add_new_line').click(function (event) {
            event.preventDefault();
            var id = element.find('#invoice_data').data('nb-invoice-line');
            var html = element.find('#empty_invoice_line').html();

            html = html
                .replace('<table><tbody>', '')
                .replace('</tbody></table>', '')
                .replace(/##ID##/g, id)
            ;

            element.find('#invoice_table').append(html);

            element.find('#unitary_price_' + id).on('change', function () {
                updateInvoiceLine(element, id);
            });

            element.find('#quantity_' + id).on('change', function () {
                updateInvoiceLine(element, id);
            });

            element.find('#invoice_data').data('nb-invoice-line', 1 + id);

            element.find('#invoice_line_tr_' + id + ' #' + id).click(function () {
                deleteInvoiceLine(element, id);
            });

            element.find('#id_invoice_category_' + id).on('change', invoiceCategoryOnChange);
        });

        element.find('[id="vat"]').on('change', function () {
            element.find('#invoice_table > tr').each(function (index) {
                updateInvoiceLine(element, index);
            });
        });

        $.ajax({
            url: url_for.invoice_new_api || url_for.invoice_new,
            method: 'GET',
            data: postData,
            error: function (data) {
                console.error(data);
            },
            accept: 'application/json',
            dataType: 'json'
        }).done(function (data) {
            newData = data;
            element.find('#invoice_table > tr').each(function (index) {
                element.find('#unitary_price_' + index).on('change', function () {
                    updateInvoiceLine(element, index);
                });

                element.find('#quantity_' + index).on('change', function () {
                    updateInvoiceLine(element, index);
                });

                element.find('#id_invoice_category_' + index).on('change', invoiceCategoryOnChange).triggerHandler('change');

                updateInvoiceLine(element, index);
            });
        });

        var invoiceCategoryOnChange = function (event)
        {
            var item = $(event.currentTarget);
            var tdParent = item.parents('td');
            var divs = tdParent.find('div');
            var invoiceCategoryDiv = $(divs[0]);
            var pricingDiv = $(divs[1]);
            var pricingSelect = pricingDiv.find('select');
            pricingSelect.html('');

            if (newData.invoice_category['list'][item.val()] && newData.invoice_category['list'][item.val()]['invoice_category'] === 'ROOTING') {
                invoiceCategoryDiv.addClass('col-xs-8');
                pricingDiv.collapse('show');

                for (var index in newData['pricing']['list']) {
                    if (newData.invoice_category['list'][item.val()]['invoice_sub_category'] === newData['pricing']['list'][index]['product'] && newData['pricing']['list'][index]['id_invoice_account'] == formInvoiceIdInvoiceAccount.val()) {
                        pricingSelect.append('<option value="' + newData['pricing']['list'][index]['id'] + '">' + newData['pricing']['list'][index]['name'] + '</option>');
                    }
                }

                pricingSelect.val(pricingSelect.data('value'));
                pricingSelect.attr('required', 'required');
            } else {
                invoiceCategoryDiv.removeClass('col-xs-8');
                pricingSelect.removeAttr('required');
                pricingDiv.removeClass('in');
            }
        };

        element.find('.close.invoice').click(function () {
            deleteInvoiceLine(element, this.id);
        });
    };

    var deleteInvoiceLine = function (element, id)
    {
        var translation = element.find('#invoice_data');

        (new PNotify({
            title: translation.data('title'),
            text: translation.data('text'),
            type: 'error',
            hide: false,
            css: {
                '': 200
            },
            animation: {
                effect_in: 'show',
                effect_out: 'slide'
            },
            confirm: {
                confirm: true,
                buttons: [
                    {
                        text: translation.data('button-ok'),
                        click: function(notice){
                            notice.remove();
                            element.find('#invoice_line_tr_' + id).remove();
                            updateInvoiceTotalPrice(element);
                        }
                    },
                    {
                        text: translation.data('button-cancel'),
                        click: function(notice){
                            notice.remove();
                        }
                    }
                ]
            }
        }));
    };

    var updateInvoiceLine = function (element, id)
    {
        // Retrieve data
        var quantity = numeral(element.find('#quantity_' + id).val());
        var unitaryPrice = numeral(element.find('#unitary_price_' + id).val());
        var vat = numeral(element.find('[id="vat"]').val().replace(',', '.'));

        // Calcul prices
        var totalHT = numeral(quantity).multiply(unitaryPrice);
        var totalVAT = numeral(numeral(totalHT).multiply(vat)).subtract(numeral(totalHT));
        var totalTTC = numeral(totalHT).add(totalVAT);

        // Retrieve DOM elements to update
        var totalHTElement = element.find('#total_HT_' + id);
        var totalVATElement = element.find('#total_VAT_' + id);
        var totalTTCElement = element.find('#total_TTC_' + id);

        // Update datas
        totalHTElement.data('total', totalHT.value());
        totalVATElement.data('total', totalVAT.value());
        totalTTCElement.data('total', totalTTC.value());

        // Update HTML
        totalHTElement.html(generateHTML(totalHT));
        totalVATElement.html(generateHTML(totalVAT, 'VAT'));
        totalTTCElement.html(generateHTML(totalTTC, 'TOTAL', false));

        updateInvoiceTotalPrice(element);
    };

    var generateHTML = function (total, style, isLabel)
    {
        if (undefined === isLabel) {
            isLabel = false;
        }

        var cssClass = isLabel ? 'label label':'text';
        var prefix = 'TOTAL' === style ? '= ':'';
        var format = 'TOTAL' === style ? '0.00':'+0.00';
        var formatedValue = total.format(format);
        var value = numeral().unformat(formatedValue);

        if (0 === value) {
            return '<div class="' + cssClass +'-muted">' + prefix + total.format('0.00') + '</div>';
        } else if (0 > value) {
            return '<div class="' + cssClass + '-success">' + prefix + formatedValue + '</div>';
        } else {
            var textClass = cssClass + '-default';

            if ('VAT' === style) {
                textClass = cssClass + '-danger';
            } else if ('TOTAL' === style) {
                textClass = cssClass + '-info';
            }

            return '<div class="' + textClass + '">' + prefix + formatedValue + '</div>';
        }
    };

    var updateInvoiceTotalPrice = function (element)
    {
        var totalHT = numeral(0);
        var totalVAT = numeral(0);
        var totalTTC = numeral(0);

        var htmlTotalHT = element.find('td[id*="total_HT"]');
        var htmlTotalVAT = element.find('td[id*="total_VAT"]');
        var htmlTotalTTC = element.find('td[id*="total_TTC"]');

        var lengthTotalHT = htmlTotalHT.length;

        for (var i = 0; i < lengthTotalHT; i++) {
            totalHT.add($(htmlTotalHT[i]).data('total'));
            totalVAT.add($(htmlTotalVAT[i]).data('total'));
            totalTTC.add($(htmlTotalTTC[i]).data('total'));
        }

        element.find('#invoice_total_price_HT').html(generateHTML(totalHT, null, true));
        element.find('#invoice_total_price_VAT').html(generateHTML(totalVAT, 'VAT', true));
        element.find('#invoice_total_price_TTC').html(generateHTML(totalTTC, 'TOTAL', true));
    };

    return {
        add: add,
        update: update,
        colorMapping: colorMapping
    };
});
